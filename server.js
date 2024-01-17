const express = require("express");
const app = express();
app.use(express.static("./public"));
const session = require("express-session")
const multer = require("multer")

const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");

app.use(session({
    secret: 'terrace cat', // any random string used for configuring the session
    resave: false,
    saveUninitialized: true
}))

let newName = ""
const myStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "./public/reviews") },

    filename: function (req, file, cb) {
        cb(null, newName + path.extname(file.originalname))
        newName = ""
    }
})

app.use(express.static(path.join(__dirname, "public")))

// associate the storage config to multer middleware
const upload = multer({ storage: myStorage })


app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }))

const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

const mongoose = require('mongoose');
const { type } = require("os");
const { dir } = require("console");
const { title } = require("process");
const { copyFileSync } = require("fs");

const CONNECTION_STRING = "mongodb+srv://dbUser:ZwtWLObPOyNN2pi1@cluster0.ab9me3p.mongodb.net/KCL?retryWrites=true&w=majority&appName=AtlasApp";

mongoose.connect(CONNECTION_STRING)

const db = mongoose.connection
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
    console.log("Mongo DB connected successfully.");
});

const Schema = mongoose.Schema

const ReviewSchema = new Schema({
    id: Number,
    title: String,
    subtitle: String,
    description: String,
    director: String,
    cast: [String],
    teaser: String,
    author: String,
    date: Date,
    infobox: String,
    promoImage: String,
})
const reviewCollection = mongoose.model("review", ReviewSchema)

const EventSchema = new Schema({
    date: Date,
    endDate: Date,
    color: String,
    title: String,
    blurb: String
})
const eventCollection = mongoose.model("event", EventSchema)


const ArticleSchema = new Schema({
    id: Number,
    author:String,
    date: Date,
    title: String,
    promoImage: String,
    subtitle: String
})

const articleCollection = mongoose.model("article", ArticleSchema)

const sortByDate = (a, b) => {
    const timeA = a.date.getTime()
    const timeB = b.date.getTime()

    if (timeA < timeB) return 1
    if (timeA > timeB) return -1
    return 0
}


//session init 


app.get("/", async (req, res) => {
    return res.render("landing", { layout: false })
})

app.get("/reviews", async (req, res) => {
    try {
        const cutOff = new Date()
        cutOff.setMonth(cutOff.getMonth() - 1)
        const results = await reviewCollection.find({ date: { $gt: cutOff } }).lean().exec()
        results.sort(sortByDate)
        //formating info for articles
        for (i of results) {
            //console.log(i.date.getTime())
            const date = i.date
            i.dateFormat = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
        }

        return res.render("reviews", { layout: false, articles: results })
    }
    catch (err) {
        console.log(err)
        return res.send(err)
    }

})

app.get("/article", async (req, res) => {
    const WE = require('word-extractor')
    const extractor = new WE()


    const id = req.query.id

    try {
        var review = await reviewCollection.findOne({ id: ~~id }).lean().exec()
        if (review === null)
        {
            review = await articleCollection.findOne({ id: ~~id }).lean().exec()
        }
        const content = []

        const extracted = extractor.extract("./public/reviews/" + id + ".docx")

        //required await for stalling load of review 
        try {
            await extracted.then((doc) => {
                const lines = doc.getBody().split(/\r?\n|\r|\n/g)
                for (var line of lines) {
                    if (line !== "") {

                        content.push(line)
                    }
                }
            })
        }
        catch (err) {
            content.push("No Review Yet")
        }


        return res.render("article", { layout: false, article: review, content: content })
    }
    catch (err) {

        console.log(err)
        return res.send(err)
    }



})

app.get("/articles", async (req, res) => {
    
    try {
        const results = await articleCollection.find().lean().exec()
        results.sort(sortByDate)

        //formating info for articles
        for (i of results) {
        
            const date = i.date
            i.dateFormat = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
        }

        return res.render("articles", { layout: false,articles:results })
    }
    catch (err) {
        console.log(err)
        return res.send(err)
    }
})


app.get("/archive", async (req, res) => {
    try {
        const cutOff = new Date()
        cutOff.setMonth(cutOff.getMonth() - 1)
        const results = await reviewCollection.find({ date: { $lt: cutOff } }).lean().exec()
        results.sort(sortByDate)
        //formating info for articles
        for (i of results) {
            //console.log(i.date.getTime())
            const date = i.date
            i.dateFormat = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
        }

        return res.render("archive", { layout: false, articles: results })
    }
    catch (err) {
        console.log(err)
        return res.send(err)
    }
})

app.post("/archive", async (req, res) => {
    try {
        const search = req.body.searchTitle

        const cutOff = new Date()
        cutOff.setMonth(cutOff.getMonth() - 1)
        const results = await reviewCollection.find({ date: { $lt: cutOff }, title: { $regex: new RegExp(search, "i") } }).lean().exec()
        results.sort(sortByDate)
        //formating info for articles
        for (i of results) {
            //console.log(i.date.getTime())
            const date = i.date
            i.dateFormat = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
        }
        return res.render("archive", { layout: false, articles: results })
    }
    catch (err) {
        console.log(err)
        return res.send(err)
    }
})

/*
==========================================================================
                    Calendar
==========================================================================
*/

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

const daysOfTheWeek = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
]

const monthLimits =
    [
        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ]

const checkLeapYear = (year) => { return !Boolean(year % 100 === 0 ? year % 400 === 0 : year % 4) }

const genCalendar = async (date) => {
    date = new Date(date)
    date.setDate(1)
    const monthList = []
    const month = date.getMonth()
    const frontBuffer = date.getDay()
    let monthLimit = monthLimits[month]
    if (checkLeapYear(date.getFullYear()) && month === 1) monthLimit = 29
    const rows = Math.ceil((monthLimit + frontBuffer) / 7)

    try {
        const dateFloor = new Date(date.getFullYear(), month, 0)
        const dateCeil = new Date(date.getFullYear(), month + 1, 0)
        const events = await eventCollection.find({
            $or: [
                { date: { $gt: dateFloor, $lte: dateCeil } },
                { endDate: { $gt: dateFloor, $lte: dateCeil } }
            ]
        }).lean().exec()

        const reviews = await reviewCollection.find({ date: { $gt: dateFloor, $lte: dateCeil } }).lean().exec()

        for (i of events) {


            i.date.setDate(i.date.getDate() + 1)
            i.endDate.setDate(i.endDate.getDate() + 1)
            if (i.date.toDateString() === i.endDate.toDateString()) {
                i.sameDay = true
            }

            else i.sameDay = false
        }


        for (let y = 0; y < rows; y++) {
            const week = []

            for (let x = 1; x <= 7; x++) {
                const day = y * 7 + x
                const dom = {}
                dom.day = day - frontBuffer
                dom.events = []
                dom.reviews = []

                if (day > monthLimit + frontBuffer || day <= frontBuffer) {
                    week.push("")
                }
                else {
                    const dayFloor = new Date(date.getFullYear(), month, dom.day)

                    for (i of events) {
                        const startDate = i.date
                        const endDate = i.endDate


                        if (dayFloor >= startDate && dayFloor <= endDate) {

                            dom.events.push(i)

                        }
                        else if (dayFloor.getDate() === startDate.getDate() && startDate.getMonth() === month) {
                            dom.events.push(i)
                        }
                    }
                    for (i of reviews) {

                        if (i.date.getDate() === dayFloor.getDate())
                            dom.reviews.push(i)
                    }

                    week.push(dom)
                }

            }
            monthList.push(week)
        }
        return monthList

    }
    catch (err) {
        console.log(err)
        return err
    }


}


app.get("/festivalWatch", async (req, res) => {
    if (req.session.date === undefined) { req.session.date = (new Date()).toDateString() }
    const date = new Date(req.session.date)
    return res.render("festivalWatch", { layout: false, calendar: await genCalendar(date), dotw: daysOfTheWeek, month: months[date.getMonth()], year: date.getFullYear() })
})


const addMonth = (date, months) => {

    date.setMonth(date.getMonth() + months)
}

app.get("/nextMonth", async (req, res) => {
    if (req.session.date === undefined) { req.session.date = (new Date()).toDateString() }
    const date = new Date(req.session.date)
    addMonth(date, 1)
    req.session.date = date.toDateString()
    res.redirect("/festivalWatch")
})
app.get("/lastMonth", async (req, res) => {
    if (req.session.date === undefined) { req.session.date = (new Date()).toDateString() }
    const date = new Date(req.session.date)
    addMonth(date, -1)
    req.session.date = date.toDateString()
    res.redirect("/festivalWatch")
})



app.get("/event", async (req, res) => {
    if (req.session.date === undefined) { req.session.date = (new Date()).toDateString() }
    date = new Date(req.session.date)
    date.setDate(req.query.day)

    const eventIds = req.query.events.split("|")
    const reviewIds = req.query.reviews.split("|")
    const results = []
    const reviews = []


    try {
        for (id of eventIds) {
            if (id.length === 24) {

                results.push(await eventCollection.findById(id).lean().exec())
            }
        }
        for (i of results) {
            i.date = i.date.toDateString()
            i.endDate = i.endDate.toDateString()
            if (i.date === i.endDate) { i.endDate = "" }
        }

        for (id of reviewIds) {
            if (id !== "") {
                reviews.push(await reviewCollection.findOne({ id: ~~id }).lean().exec())
            }
        }

        for (i of reviews) {
            i.dateFormat = i.date.toDateString()
        }

        return res.render("event", { layout: false, events: results, date: date.toDateString(), reviews: reviews })


    }
    catch (err) {
        console.log(err)
        return res.send(err)
    }



})



// DATA ENTRY

const onHttpStart = () => {
    console.log(`Express web server running on port: ${HTTP_PORT}`)
    console.log(`Press CTRL+C to exit`)
}
app.listen(HTTP_PORT, onHttpStart)
