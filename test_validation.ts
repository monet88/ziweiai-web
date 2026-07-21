import { createChartRequestSchema } from './packages/contracts/src/api/backend-api.ts';

const payload = {"birthInput":{"calendar":"gregorian","date":{"year":1990,"month":1,"day":1},"time":{"hour":12,"minute":0,"isUnknown":false},"sexOrGenderForChart":"male","place":{"label":"Hà Nội"},"locale":"vi-VN","source":"user-entered"},"chartSystem":"zi-wei-dou-shu","makeActiveBirthProfile":true};

try {
  createChartRequestSchema.parse(payload);
  console.log("Success!");
} catch (e) {
  console.error("Validation Error:", e);
}
