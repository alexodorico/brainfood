var connect = require("connect");
var serveStatic = require("serve-static");

connect().use(serveStatic(__dirname)).listen(8080, _ => {
    console.log("Server running on port 8080 🤘");
});