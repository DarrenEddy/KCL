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

const daysOfTheWeek = 
[
"Sun","Mon","Tue","Wed","Thu","Fri","Sat"
]

const monthLimits =
    [
        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ]



const checkLeapYear = (year) => {return !Boolean(year % 100 === 0 ? year % 400 === 0 : year % 4)}
const genCalendar = (date) => {
    date.setDate(1)
    const monthList = []
    const month = date.getMonth()
    const frontBuffer = date.getDay()
    let monthLimit = monthLimits[month]

    if (checkLeapYear(date.getFullYear())&& month === 1)monthLimit=29

    const rows = Math.ceil((monthLimit+frontBuffer)/7)

    for (let y = 0; y < rows; y++) {
        const week = []

        for (let x = 1; x <= 7; x++) {
            const day = y * 7 + x
            
            if (day > monthLimit + frontBuffer || day <= frontBuffer) {
                week.push(" ")
            }
            else week.push(day - frontBuffer)
            
        }
        monthList.push(week)
    }
    return monthList
}

const addYear = (date,years) => {date.setFullYear(date.getFullYear()+years)}
const addMonth = (date,months) => {date.setMonth(date.getMonth()+months)}


document.querySelector("#nextMonth").addEventListener("click", () => {
    addMonth(currentDate,1)
    document.getElementById("month").innerHTML = months[currentDate.getMonth()] +" "+ currentDate.getFullYear()

    console.log(genCalendar(currentDate))
})

document.querySelector("#prevMonth").addEventListener("click", () => {
    addMonth(currentDate,-1)
    document.getElementById("month").innerHTML = months[currentDate.getMonth()] +" "+ currentDate.getFullYear()
    console.log(genCalendar(currentDate))

})
