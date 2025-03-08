const axios = require("axios");
const xml2js = require("xml2js");

async function addEmployees(data) {
  const url =
    "http://122.164.125.145:88/iclock/WebAPIService.asmx?op=AddEmployee";
  const headers = {
    "Content-Type": "text/xml; charset=utf-8",
    SOAPAction: "http://tempuri.org/AddEmployee"
  };

  const requests = data.map(async item => {
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <AddEmployee xmlns="http://tempuri.org/">
          <APIKey></APIKey>
          <EmployeeCode>${item.EmployeeCode}</EmployeeCode>
          <EmployeeName>${item.employeename}</EmployeeName>
          <CardNumber></CardNumber>
          <SerialNumber>${item.SerialNumber}</SerialNumber>
          <UserName>${item.UserName}</UserName>
          <UserPassword>${item.UserPassword}</UserPassword>
          <CommandId>1</CommandId>
        </AddEmployee>
      </soap:Body>
    </soap:Envelope>`;

    try {
      const response = await axios.post(url, xmlData, { headers });

      //   const responseText = await response.text();
      //   console.log(`Response for ${item.employeename}:`, responseText);
    } catch (error) {
      console.error(`Error for ${item.employeename}:`, error.message);
    }
  });

  await Promise.all(requests);
}

async function getTransactionsLog(data) {
  const url =
    "http://122.164.125.145:88/iclock/WebAPIService.asmx?op=GetTransactionsLog";
  const headers = {
    "Content-Type": "text/xml",
    SOAPAction: "http://tempuri.org/GetTransactionsLog"
  };

  // Get current date with correct formatting
  const date = new Date();
  const pad = num => String(num).padStart(2, "0");
  const fromDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} 00:00`;
  const toDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} 23:59`;

  const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <GetTransactionsLog xmlns="http://tempuri.org/">
        <FromDateTime>${fromDate}</FromDateTime>
        <ToDateTime>${toDate}</ToDateTime>
        <SerialNumber>${data.SerialNumber}</SerialNumber>
        <UserName>${data.UserName}</UserName>
        <UserPassword>${data.UserPassword}</UserPassword>      
        <strDataList></strDataList>
      </GetTransactionsLog>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const response = await axios.post(url, xmlRequest, { headers });

    // // Convert XML response to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    const transactions =
      result["soap:Envelope"]["soap:Body"]["GetTransactionsLogResponse"];

    // console.log(
    //   "SOAP API Response (JSON):",
    //   JSON.stringify(transactions, null, 2)
    // );

    return result;
  } catch (error) {
    console.error("SOAP API Error:", error.message);
    throw error;
  }
}

module.exports = { addEmployees, getTransactionsLog };
