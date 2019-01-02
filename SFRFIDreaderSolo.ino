////Librarys
#include <SparkFun_UHF_RFID_Reader.h> //library for controlling the M6E nano
#include <SoftwareSerial.h> //Used to transmit data to the device through Ardunio

//Set software serial
SoftwareSerial softwareSerial(11, 3); //for the leonardo RX, TX

//Instances
RFID nanoMod; //creates an instance


//Properties
byte myUID[12];
byte myUIDlength;

int ledPin = 13;
int microwavePin = 6;
int readPin;

char incomingByte = Serial.read();
byte responseType = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  pinMode(ledPin, OUTPUT);
  pinMode(microwavePin, INPUT);
  digitalWrite(ledPin, LOW);

  if (setupNano(38400) == false) { //configure nano to run at 38400bps
    while (setupNano(38400) == false) {
      digitalWrite(ledPin, HIGH);
    }
    while (1); //Freeze program
  }
  nanoMod.setRegion(REGION_EUROPE); //Set region to Europe
  nanoMod.setReadPower(500); //set read power to 5.00dbm, max read is 27dbm but this might cause overheating but will extend the range.
  nanoMod.setWritePower(500);
}

void loop() {
  readPin = digitalRead(microwavePin);
  if (readPin == LOW) {
    Serial.write(20);
    if (incomingByte == 'a') {
      while (responseType != RESPONSE_SUCCESS) {
        myUIDlength = sizeof(myUID);
        responseType = nanoMod.readTagEPC(myUID, myUIDlength, 500);
        //Serial.println(F("Scanning"));
      }
      if (responseType == RESPONSE_SUCCESS) {
        for (uint8_t x = 0; x < myUIDlength; x ++) {
          if (myUID[x] < 0x10) {
          } //Pretty print
          Serial.write(myUID[x]);
        }
      }
    }
    if (incomingByte == 'b') {

      char stringToWrite[] = "Tag1"; //string to write to tag. You can only write an even number of byte so strings must be even.
      byte response = nanoMod.writeUserData(stringToWrite, sizeof(stringToWrite) - 1); //-1 removes the 0 from the end of the string
      if (response == RESPONSE_SUCCESS) {

      } else {

        delay(500);

      }
    }
  }
}






boolean setupNano(long baudrate) {
  //  Serial.println("running setup of rfid reader");
  nanoMod.begin(softwareSerial); // unit to communicate over serial port
  softwareSerial.begin(baudrate); //set module to desired baud rate
  while (!softwareSerial); //wait for the port to open

  while (softwareSerial.available()) softwareSerial.read();

  nanoMod.getVersion();

  if (nanoMod.msg[0] == ERROR_WRONG_OPCODE_RESPONSE) {
    //Happens if the baud rate is correct but the module is doing a continous read
    nanoMod.stopReading();
    //    Serial.print(F("Module is continously reading. Asking it to stop"));
    delay(2000);
  } else {
    //The module did not respond so assume it has been just powered on and is communicating at 115200bps
    softwareSerial.begin(115200);

    nanoMod.setBaud(baudrate);
    softwareSerial.begin(baudrate);
  }
  //Test the connection
  nanoMod.getVersion();
  if (nanoMod.msg[0] != ALL_GOOD) return (false); //something has gone wrong
  nanoMod.setTagProtocol(); //Set protocol to GEN2
  nanoMod.setAntennaPort(); //Set TX/RX antenna ports to 1
  return (true); //everything is A-OK!
}

