const jsdom = require('jsdom')
const fs = require('fs')
const { stringify } = require('csv-stringify/sync')
const { JSDOM } = jsdom

const GUILD = "OnlyUp" // Put your guild name here
const COOKIE = "" // Put your "Cookie" header on realmeye here (Dont share it with anyone)

/*
* Return/Estimate how many days since member has been online.
* Because realmeye sometimes only can give a precision of the number of weeks someone has been off, we estimate
*/
const parseLastSeenDate = (lastSeenString) => {
  if(lastSeenString.includes('hour') || lastSeenString.includes('hours')) {
    return 0
  }

  if(lastSeenString.includes('minute') || lastSeenString.includes('minutes')) {
    return 0
  }

  if(lastSeenString.includes('day') || lastSeenString.includes('days')) {
    const days = parseInt(lastSeenString.split(' ')[0])
    return days
  }

  if(lastSeenString.includes('week') || lastSeenString.includes('weeks')) {
    const stringWithoutFirst = lastSeenString.slice(1)
    const weeksNum = parseInt(stringWithoutFirst.split(' ')[0])
    return weeksNum * 7
  }

  // Date string
  if(lastSeenString.includes(':')) {
    const lastSeenDate = new Date(lastSeenString)
    const nowDate = new Date()

    const diffInMs = Math.abs(nowDate - lastSeenDate);
    const diffInDays =  diffInMs / (1000 * 60 * 60 * 24);
    return Math.round(diffInDays)
  }

  return lastSeenString
}

const main = async () => {
  const res = await fetch(`https://www.realmeye.com/guild/${GUILD}`, {
    headers: {
      Cookie: COOKIE
    }
  })
  const body = await res.text()
  const dom = new JSDOM(body)

  const tableRows = dom.window.document.querySelectorAll("table tbody tr")
  const columns = []
  columns.push(['Name', 'Guild Rank', 'Fame', 'Stars', 'Characters', 'Last Seen', 'Server', 'Average Fame Per Char']) // Headers

  tableRows.forEach((r, i) => {
    if([0, 1, 2, 3].includes(i)) return // Hack to skip first tables above.

    const [name, guildRank, fame, stars, characters, lastSeen, server, averageFamePerChar] = r.querySelectorAll("td")
    const column = [name?.textContent, guildRank?.textContent, fame?.textContent, stars?.textContent, characters?.textContent, parseLastSeenDate(lastSeen?.textContent), server?.textContent, averageFamePerChar?.textContent]
    columns.push(column)
  })

  // Sort so that members that have been away longest show up first.
  columns.sort((colA, colB) => colB[5] - colA[5])

  const output = stringify(columns)
  fs.writeFileSync('output/members.csv', output)

  console.log(output)
}



main().catch(e => console.error("GLOBAL ERROR HANDLER CAUGHT -> ", e))