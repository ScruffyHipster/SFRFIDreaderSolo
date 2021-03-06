function DeviceManager() {

  var tagInfo = [];

  this.storeTag = function(data) {
    tagInfo = [];
    tagInfo.push(data);
  };

  this.checkStoredPersonData = function() {
    for(var i = 0; i < tagInfo.length; i++) {
      var info = tagInfo[i];
      printOut("scanned tag info is " + info);
      for(var b = 0; b < KNOWN_VISITORS.length; b++) {
        var visitor = KNOWN_VISITORS[b];
        var visitorId = visitor.getTagId();
        printOut("visitor is " + visitorId);
        if(info == visitorId) {
          //get sign info
          var a = getCurrentSignInfo();
          printOut("sign is " + a);
          var personName = visitor.getPersonName();
          //visitor.visitCountIncrement();
          printOut("name is " + personName);
          if(a == "RFIDframeTest") {
            var getFNLayer = SignStixGraphics.getLayerNamed('UserName');
            getFNLayer.setText("Welcome " + personName);
            updateDisplay();
          }
        }
      }
    }
  };

  this.checkStoredDeviceData = function() {
    for(var i = 0; i < tagInfo.length; i++) {
      var info = tagInfo[i];
      printOut("scanned tag info is " + info);
      for(var b = 0; b < KNOWN_DEVICES.length; b++) {
        var device = KNOWN_DEVICES[b];
        var deviceId = device.getTagId();
        if(info == deviceId) {
          //get sign info
          var a = getCurrentSignInfo();
          printOut("sign is " + a);
          var deviceName = device.getDeviceName();
          //visitor.visitCountIncrement();
          printOut("name is " + deviceName);
          if(a == "PhoneAttractorUXG") {
            var sign = device.getSignName();
            printOut(sign);
            switch(deviceName) {
              case "iPhone 3GS":
              jumpToSign(sign);
              break;
              case "iPhone 7 Plus":
              jumpToSign(sign);
              break;
            }
          }
        }
      }
    }
  };
}


function DeviceTagInfo(deviceName, tagID, signName) {
  this.MdeviceName = deviceName;
  this.MtagID = tagID;
  this.MsignName = signName;
  this.MamountUsed = 0;

  //functions
  this.getDeviceName = function() {
    return this.MdeviceName;
  };
  this.getTagId = function() {
    return this.MtagID;
  };
  this.getSignName = function() {
    return this.MsignName;
  };
  this.getAmountUsed = function() {
    return this.MamountUsed;
  };
  this.incrementNumAdded = function() {
    this.MamountUsed ++;
  };


}

function GetPersonTagInfo(personFirstName, personLastName, tagID) {

  //init
  this.MpersonFirstName = personFirstName;
  this.MpersonLastName = personLastName;
  this.MtagID = tagID;
  this.MpersonVisitCount = 0;

  //functions
  this.getPersonName = function() {
    var fullName  = this.MpersonFirstName + " " + this.MpersonLastName;
    return fullName;
  };
  this.getTagId = function() {
    return this.MtagID;
  };
  this.visitCountIncrement = function() {
    this.MpersonVisitCount ++;
  };

}


//////////////////////end of classes /////////////////////////

//instances
const deviceInfo = new DeviceTagInfo();
const personInfo = new GetPersonTagInfo();
const deviceManager = new DeviceManager();

var person1 = new GetPersonTagInfo("Jim", "Halpert", "E20040057305014817705F6E");
var person2 = new GetPersonTagInfo("Dwight", "Schrute", "E20040057305015317705F75");
var person3 = new GetPersonTagInfo("Michael", "Scott", "E20040057305014417705F60");
var person4 = new GetPersonTagInfo("Pam", "Halpert", "E20040057305013617705F50");
var person5 = new GetPersonTagInfo("Angela", "Schrute", "E20040057305014017705F5E");

var vendor = '2341';
var product = '8036';

//Array of the known Objects to show in the signage software
const KNOWN_VISITORS = [person1, person2, person3, person4, person5];

//global variables
var currentSign = " ";
var microControllerInfo = getDeviceInfoFor(vendor, product);

if (microControllerInfo == null) {
  SignStixDebug.error("Cannot get permission");
}
SignStixSerial.requestPermission(microControllerInfo.devicePath, "onPermissionGranted");

//1 shows which device is shown
function myDeviceInfo() {
  var info = SignStixConfig.getDeviceId();
  if (info != null) {
    SignStixDebug.info(info);
  } else {
    SignStixDebug.error("error getting device name");
  }
}


//2 get device info for serial use
function getDeviceInfoFor(vendorId, productId) {
 var devicesInfo = SignStixSerial.getDevicesInfo();
 var devices = JSON.parse(devicesInfo);
 printOut(devicesInfo);
 var device = null;
 var i;
 for (i = 0; i < devices.length; i++) {
       device = devices[i]
   if (device.vendorId == vendorId && device.productId == productId) {
     return device;
   } else {
     SignStixDebug.error("Error gaining device info", vendorId && productId);
   }
 }
  return null;
}

//3 get permission
function onPermissionGranted(devicePath, success) {
  SignStixDebug.info("we got permission granted ");
  var driverName = "usb";
  var baudRate = 9600;
  var stopBits = 1;
  var dataBits = 8;
  var parity = 0;
  var connectionId = SignStixSerial.connect(devicePath, driverName, baudRate, stopBits, dataBits, parity);
  //starts reading from the serial device
  SignStixSerial.write(connectionId, '61'); //letter a
  SignStixSerial.startReading(connectionId, "globalOnDataRead");
  SignStixDebug.info("Now starting to read data");
}

//4 Read from the device and change content on SignStix device
function globalOnDataRead(connectionId, hexData) {
  printOut(hexData);
  deviceManager.storeTag(hexData);
  currentSign = getCurrentSignInfo();
  switch(currentSign) {
    case "RFIDframeTest":
    deviceManager.checkStoredPersonData();
    break;
  }
}

////////////////////////////functions//////////////////////////////

function getCurrentSignInfo() {
  var currentSign = SignStixStats.getCurrentSignInfo()
  var currInfo = JSON.parse(currentSign);
  var currentSign = currInfo.signName;
  return currentSign;
}

function printOut(string) {
  SignStixDebug.info(string);
}

function updateDisplay() {
  SignStixGraphics.updateDisplay();
}

function jumpToSign(signName) {
  SignStixEngine.jumpToSignInSequence(signName);
  currentSign = signName;
}

//resets the screen back to the original state
function revertToHomeScreen(sign) {
  printOut("resetting to home from " + sign);
  switch(sign) {
    case "RFIDframeTest":
    var getFNLayer = SignStixGraphics.getLayerNamed('UserName');
    getFNLayer.setText("Welcome...");
    updateDisplay();
    break;
    case "PhoneAttractorUXG":
    jumpToSign("PhoneAttractorUXG");
    break;
  }
}

//////////////////////////end of functions///////////////////////
