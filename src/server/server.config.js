import axios from "axios";

export default axios.create({
    headers: {
        "Content-type": "application/json",
        "Access-Control-Allow-Origin" : "*",
    },
    baseURL: "http://localhost:3000",
});