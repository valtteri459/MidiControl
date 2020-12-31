/* eslint-disable */ 
const ffi = require('ffi-napi');
const electron = require('electron')
const Registry = require('./winreg');

const ArrayType = require('ref-array-napi');
const CharArray = ArrayType('char');
const LongArray = ArrayType('long');
const FloatArray = ArrayType('float');

async function getDLLPath() {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: "\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VB:Voicemeeter {17359A74-1236-5467}",
  });
  return new Promise(resolve => {
    regKey.values((err, items) => {
      const unistallerPath = items.find(i => i.name === 'UninstallString').value;
      const fileNameIndex = unistallerPath.lastIndexOf('\\');
      resolve(unistallerPath.slice(0, fileNameIndex));
    });
  });
}


const {
  VoicemeeterDefaultConfig,
  VoicemeeterType,
  InterfaceType
} = require('./voicemeeterUtils');

const isEmpty = function (object) {
  for (let key in object) {
    if (object.hasOwnProperty(key))
      return false;
  }
  return true;
};

let libvoicemeeter;

const voicemeeter = {
  isConnected: false,
  isInitialised: false,
  isLoggedIn: false,      // True when login has been performed
  isConfigured: false,    // True when configuration has been set
  outputDevices: [],
  inputDevices: [],
  type: 0,
  version: null,
  voicemeeterConfig: {},
  async init(){
    libvoicemeeter = ffi.Library(await getDLLPath() + '/VoicemeeterRemote64.dll', {
      'VBVMR_Login': ['long', []],
      'VBVMR_Logout': ['long', []],
      'VBVMR_RunVoicemeeter': ['long', ['long']],

      'VBVMR_GetVoicemeeterType': ['long', [LongArray]],
      'VBVMR_GetVoicemeeterVersion': ['long', [LongArray]],

      'VBVMR_IsParametersDirty':['long',[]],
      'VBVMR_GetParameterFloat': ['long',[CharArray,FloatArray]],
      'VBVMR_GetParameterStringA': ['long',[CharArray,CharArray]],

      'VBVMR_SetParameters': ['long', [CharArray]],
      'VBVMR_Output_GetDeviceNumber': ['long', []],
      'VBVMR_Output_GetDeviceDescA': ['long', ['long', LongArray, CharArray, CharArray]],
      'VBVMR_Input_GetDeviceNumber': ['long', []],
      'VBVMR_Input_GetDeviceDescA': ['long', ['long', LongArray, CharArray, CharArray]],
    });
    this.isInitialised = true;
  },

  runvoicemeeter(voicemeeterType) {
    if (libvoicemeeter.VBVMR_RunVoicemeeter(voicemeeterType) === 0) {
      return;
    }
    throw "running failed";
  },
  isParametersDirty(){

    const res = libvoicemeeter.VBVMR_IsParametersDirty();

    // If Voicemeeter is currently running and connected, res will be 0 or positive
    this.isConnected = (res >= 0);

    // Get configuration once when we have the first connection to Voicemeeter
    if (this.isConnected && !this.isConfigured) {
      this.type = this._getVoicemeeterType();
      this.version = this._getVoicemeeterVersion();
      this.voicemeeterConfig = VoicemeeterDefaultConfig[this._getVoicemeeterType()];
    }

    return res;
  },
  getParameter(parameterName){
    if (!this.isConnected) {
      throw "Not connected ";
    }
    // var hardwareIdPtr = new Buffer(parameterName.length + 1);
    var hardwareIdPtr = Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    var namePtr = new FloatArray(1);
    libvoicemeeter.VBVMR_GetParameterFloat(hardwareIdPtr,namePtr);
    return namePtr[0]
  },

  _getVoicemeeterType() {
    var typePtr = new LongArray(1);
    if (libvoicemeeter.VBVMR_GetVoicemeeterType(typePtr) !== 0) {
      throw "running failed";
    }
    switch (typePtr[0]) {
      case 1: // Voicemeeter software
        return VoicemeeterType.voicemeeter;
      case 2: // Voicemeeter Banana software
        return VoicemeeterType.voicemeeterBanana;
      case 3:
        return VoicemeeterType.voicemetterPotato;
      default: // unknow software
        return VoicemeeterType.unknow
    }

  },

  _getVoicemeeterVersion() {
    const versionPtr = new LongArray(1);
    if (libvoicemeeter.VBVMR_GetVoicemeeterVersion(versionPtr) !== 0) {
      throw "running failed";
    }
    const v4 = versionPtr[0]%(2^8);
    const v3 = parseInt((versionPtr[0]-v4)%Math.pow(2, 16)/Math.pow(2, 8));
    const v2 = parseInt(((versionPtr[0]-v3*256-v4)%Math.pow(2, 24))/Math.pow(2, 16));
    const v1 = parseInt((versionPtr[0]-v2*512-v3*256-v4)/Math.pow(2, 24));
    return `${v1}.${v2}.${v3}.${v4}`;
  },

  login() {
  
    // Only one login for the lifetime of this process
    if (this.isLoggedIn) {
      return;
    }

    if(!this.isInitialised){
      throw "await the initialisation before login";
    }
   
    const res = libvoicemeeter.VBVMR_Login(); 

    this.isLoggedIn = true;
    
    // Login will always succeed. Check isParametersDirty() to find out if connected to Voicemeeter.
    // Check if we are connected
    this.isParametersDirty()
        
    return;
    
  },

  logout() {
    if (!this.isConnected) {
      throw "Not connected ";
    }
    if (libvoicemeeter.VBVMR_Logout() === 0) {
      this.isConnected = false;
      return;
    }
    throw "Logout failed";
  },

  updateDeviceList() {
    if (!this.isConnected) {
      throw "Not connected ";
    }
    this.outputDevices = [];
    this.inputDevices = [];
    const outputDeviceNumber = libvoicemeeter.VBVMR_Output_GetDeviceNumber();
    for (let i = 0; i < outputDeviceNumber; i++) {

      var hardwareIdPtr = new CharArray(256);
      var namePtr = new CharArray(256);
      var typePtr = new LongArray(1);

      libvoicemeeter.VBVMR_Output_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr);
      this.outputDevices.push({
        name: String.fromCharCode(...namePtr.toArray()).replace(/\u0000+$/g, ''),
        hardwareId: String.fromCharCode(...hardwareIdPtr.toArray()).replace(/\u0000+$/g, ''),
        type: typePtr[0]
      })
    }

    const inputDeviceNumber = libvoicemeeter.VBVMR_Input_GetDeviceNumber();
    for (let i = 0; i < inputDeviceNumber; i++) {

      var hardwareIdPtr = new CharArray(256);
      var namePtr = new CharArray(256);
      var typePtr = new LongArray(1); 

      libvoicemeeter.VBVMR_Input_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr);
      this.inputDevices.push({
        name: String.fromCharCode(...namePtr.toArray()).replace(/\u0000+$/g, ''),
        hardwareId: String.fromCharCode(...hardwareIdPtr.toArray()).replace(/\u0000+$/g, ''),
        type: typePtr[0]
      })
    }
  },

  _sendRawParameterScript(scriptString) {
    const script = Buffer.alloc(scriptString.length + 1);
    script.fill(0);
    script.write(scriptString);
    return libvoicemeeter.VBVMR_SetParameters(script);
  },

  _setParameter(type, name, id, value) {

    if (!this.isConnected) {
      throw "Not connected ";
    }
    if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
      throw "Configuration error  ";
    }
    const interfaceType = type === InterfaceType.strip ? 'Strip' : 'Bus';
    const voicemeeterConfigObject = type === InterfaceType.strip ? 'strips' : 'buses';

    // Convert to number for comparison
    const idNum = parseInt(id)

    if (this.voicemeeterConfig[voicemeeterConfigObject].findIndex(strip => strip.id == idNum) == -1) {
      throw `${interfaceType} ${id} not found`;
    }
    
    // const parametersScript = `${interfaceType.toLowerCase()}[${id}].${name.toLowerCase()}=${value}`
    const parametersScript = `${interfaceType}[${id}].${name}=${value}`

    return this._sendRawParameterScript(parametersScript);
  },

  _setParameters(parameters) {

    if (!this.isConnected) {
      throw "Not connected ";
    }
    if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
      throw "Configuration error  ";
    }

    if (!Array.isArray(parameters)) {
      throw interfaceType + " not found";
    }

    const script = parameters.map(p => {
      const interfaceType = p.type === InterfaceType.strip ? 'Strip' : 'Bus';
      const voicemeeterConfigObject = p.type === InterfaceType.strip ? 'strips' : 'buses';

      if (!this.voicemeeterConfig[voicemeeterConfigObject].find(strip => strip.id === p.id)) {
        throw interfaceType + " not found";
      }
      return `${interfaceType}[${p.id}].${p.name}=${p.value};`;
    }).join('\n');

    return this._sendRawParameterScript(script);

  },

};

//Create setter function
const parameterStripNames = ['mono', 'solo', 'mute', 'gain', 'gate', 'comp'];
const parameterBusNames = ['mono', 'mute','gain','sel'];

parameterBusNames.forEach(name => {
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  voicemeeter[`setBus${capitalizedName}`] = function (busNumber, value) {
    if (typeof (value) === 'boolean') {
      voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value ? '1' : '0')
    } else {
      voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value)
    }
  }
});

parameterStripNames.forEach(name => {
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  voicemeeter[`setStrip${capitalizedName}`] = function (stripNumber, value) {
   
    if (typeof (value) === 'boolean') {
      voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value ? '1' : '0')
    } else {
      voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value)
    }
  }

});
module.exports = voicemeeter;

// For test only
/*
async function start(){
  try{
    await voicemeeter.init();
    voicemeeter.login();
    voicemeeter.updateDeviceList();

    voicemeeter.inputDevices.forEach(d => {
      console.log(d)
    })
    console.log('voicemeeter version',voicemeeter.version);
    console.log(voicemeeter.getParameter('Strip[1].gain'));
    
    setInterval(()=>{
      if(voicemeeter.isParametersDirty()){
        console.log(voicemeeter.getParameter('Strip[1].gain'));
      }
    },10)
    //voicemeeter.logout();
  }
  catch(e){
    console.log(e)
  }
}
start();
// */

// async function start () {
//   await voicemeeter.init()
//   voicemeeter.login()


//   console.log(voicemeeter._getVoicemeeterType())
//   console.log(voicemeeter._getVoicemeeterVersion())
//   console.log(voicemeeter.isParametersDirty())



//   voicemeeter.setStripMute(5, true)
  

//   setInterval(()=>{
//     if(voicemeeter.isParametersDirty()){
//       console.log(voicemeeter.getParameter('Strip[1].gain'));
//     }
//     voicemeeter.logout()
//   },10)
 
// }
// start()