const axios = require("axios");

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

module.exports = { addEmployees };
