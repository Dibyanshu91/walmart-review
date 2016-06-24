var request = require('request');
describe("SearchText is invalid", function() {
    it("should respond with 404 http status code", function (done) {
        request("http://localhost:3000/abc", function (error, response, body) {
            expect(response.statusCode).toBe(404);
            done();
        });
    });
});

describe("SearchText is valid", function() {
    it("should respond with 200 http json code", function (done) {
        request("http://localhost:3000/abc?searchtext=iphone", function (error, response, body) {
            expect(response.statusCode).toBe(200);
            done();
        });
    });
});
