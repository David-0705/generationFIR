const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FirSchema = new Schema({
  meta: {
    district: String,
    policeStation: String,
    year: Number,
    firNo: String,
    firDateTime: Date
  },
  section2: [
    {
      sno: Number,
      act: String,
      section: String
    }
  ],
  occurrence: {
    day: String,
    dateFrom: Date,
    dateTo: Date,
    timePeriod: String,
    timeFrom: String,
    timeTo: String,
    infoReceivedAtPS: {
      date: Date,
      time: String
    },
    gdRef: {
      entryNo: String,
      dateTime: Date
    }
  },
  typeOfInfo: String,
  placeOfOccurrence: {
    directionDistanceFromPS: String,
    address: String,
    outsidePSName: String,
    districtState: String
  },
  complainant: {
    name: String,
    fatherOrHusbandName: String,
    dob: String,
    nationality: String,
    uidNo: String,
    passportNo: String,
    idDetails: String,
    occupation: String,
    currentAddress: String,
    permanentAddress: String,
    phone: String,
    mobile: String
  },
  accused: [
    {
      name: String,
      alias: String,
      relativeName: String,
      address: String
    }
  ],
  delayReason: String,
  totalValueOfProperty: Number,
  inquestReport: String,
  firstInformationContents: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Fir", FirSchema);
