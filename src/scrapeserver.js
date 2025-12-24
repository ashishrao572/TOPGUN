// server.js
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import FinancialPeriod from './FinancialPeriod.js';

const { getCurrentIndianQuarter, getPreviousIndianQuarter } = FinancialPeriod;

const app = express();
const PORT = 5000;
app.use(cors());

const ScrapePage = (async(pPage, pUrl) =>
{
    await pPage.goto(pUrl, { waitUntil: 'networkidle2', timeout: 0 });
    await pPage.waitForSelector('#DataTables_Table_0');

    const tableData = await pPage.evaluate(() => {
      const table = document.querySelector('#DataTables_Table_0');
      const rows = [];
      if (!table) return rows;

      table.querySelectorAll('tbody tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
            if (cells[3] === "Filing Awaited" || cells[3] === "New") {
                rows.push(cells);
            }
      });
      return rows;
    });

    return tableData;
});


app.get('/portfolio', async (req, res) => {
  try {
    const current = getCurrentIndianQuarter();
    // Accept query params 'quarter' and 'fy' (or 'financialYear') and validate them
    let quarter = (req.query.quarter || current.quarter).toString().toUpperCase();
    let financialYear = req.query.fy ? parseInt(req.query.fy, 10) : (req.query.financialYear ? parseInt(req.query.financialYear, 10) : current.financialYear);

    // Validate quarter and financialYear, fall back to current values if invalid
    if (!/^Q[1-4]$/.test(quarter)) {
      console.warn(`Invalid quarter param '${req.query.quarter}', falling back to ${current.quarter}`);
      quarter = current.quarter;
    }
    if (Number.isNaN(financialYear)) {
      console.warn(`Invalid fy param '${req.query.fy}', falling back to ${current.financialYear}`);
      financialYear = current.financialYear;
    }

    const baseUrl = 'https://trendlyne.com/portfolio/superstar-shareholders';
    console.log(`Requested Quarter: ${quarter}, Financial Year: ${financialYear}`);
    const urls = [
       `${baseUrl}/2214734/${quarter}-${financialYear}/mukesh-ambani-and-family-portfolio/`,
       `${baseUrl}/178317/${quarter}-${financialYear}/radhakishan-damani-portfolio/`,
       `${baseUrl}/584333/${quarter}-${financialYear}/premji-and-associates-portfolio/`,
       `${baseUrl}/53781/${quarter}-${financialYear}/rakesh-jhunjhunwala-and-associates-portfolio/`,
       `${baseUrl}/53782/${quarter}-${financialYear}/rekha-jhunjhunwala-portfolio/`,
       `${baseUrl}/53740/${quarter}-${financialYear}/akash-bhanshali-portfolio/`,
       `${baseUrl}/53774/${quarter}-${financialYear}/mukul-agrawal-portfolio/`,
       `${baseUrl}/53745/${quarter}-${financialYear}/ashish-dhawan-portfolio/`,
       `${baseUrl}/53746/${quarter}-${financialYear}/ashish-kacholia-portfolio/`,
       `${baseUrl}/53776/${quarter}-${financialYear}/nemish-s-shah-portfolio/`,
       `${baseUrl}/182955/${quarter}-${financialYear}/sunil-singhania-portfolio/`,
       `${baseUrl}/584325/${quarter}-${financialYear}/madhusudan-kela-portfolio/`,
       `${baseUrl}/53743/${quarter}-${financialYear}/anil-kumar-goel-and-associates-portfolio/`,
       `${baseUrl}/584330/${quarter}-${financialYear}/bhavook-tripathi-portfolio/`,
       `${baseUrl}/53805/${quarter}-${financialYear}/vijay-kishanlal-kedia-portfolio/`,
       `${baseUrl}/53755/${quarter}-${financialYear}/dilipkumar-lakhi-portfolio/`,
       `${baseUrl}/53744/${quarter}-${financialYear}/anuj-anantrai-sheth-and-associates-portfolio/`,
       `${baseUrl}/53763/${quarter}-${financialYear}/hitesh-satishchandra-doshi-portfolio/`,
       `${baseUrl}/53739/${quarter}-${financialYear}/ajay-upadhyaya-portfolio/`,
       `${baseUrl}/53802/${quarter}-${financialYear}/suresh-kumar-agarwal-portfolio/`,
       `${baseUrl}/53804/${quarter}-${financialYear}/vanaja-sundar-iyer-portfolio/`,
       `${baseUrl}/53791/${quarter}-${financialYear}/sanjiv-dhireshbhai-shah-portfolio/`,
       `${baseUrl}/53765/${quarter}-${financialYear}/keswani-haresh-portfolio/`,
       `${baseUrl}/53798/${quarter}-${financialYear}/shivani-tejas-trivedi-portfolio/`,
       `${baseUrl}/584324/${quarter}-${financialYear}/girish-gulati-portfolio/`,
       `${baseUrl}/53783/${quarter}-${financialYear}/ricky-ishwardas-kirpalani-portfolio/`,
       `${baseUrl}/69664/${quarter}-${financialYear}/mohnish-pabrai-portfolio/`,
       `${baseUrl}/53757/${quarter}-${financialYear}/dolly-khanna-portfolio/`,
       `${baseUrl}/53795/${quarter}-${financialYear}/seetha-kumari-portfolio/`,
       `${baseUrl}/53786/${quarter}-${financialYear}/sangeetha-s-portfolio/`,
       `${baseUrl}/53762/${quarter}-${financialYear}/hitesh-ramji-javeri-and-associates-portfolio/`,
       `${baseUrl}/53751/${quarter}-${financialYear}/bharat-jayantilal-patel-and-associates-portfolio/`,
       `${baseUrl}/53796/${quarter}-${financialYear}/sharad-kanayalal-shah-and-associates-portfolio/`,
       `${baseUrl}/584331/${quarter}-${financialYear}/amal-parikh-portfolio/`,
       `${baseUrl}/53748/${quarter}-${financialYear}/ashok-kumar-jain-portfolio/`,
       `${baseUrl}/53767/${quarter}-${financialYear}/lata-bhanshali-portfolio/`,
       `${baseUrl}/53772/${quarter}-${financialYear}/minal-bharat-patel-portfolio/`,
       `${baseUrl}/53761/${quarter}-${financialYear}/hiten-anantrai-sheth-portfolio/`,
       `${baseUrl}/53749/${quarter}-${financialYear}/atim-kabra-portfolio/`,
       `${baseUrl}/53803/${quarter}-${financialYear}/vallabh-roopchand-bhanshali-portfolio/`,
       `${baseUrl}/53800/${quarter}-${financialYear}/sunil-kumar-portfolio/`,
       `${baseUrl}/53807/${quarter}-${financialYear}/vinodchandra-mansukhlal-parekh-and-associates-portfolio/`,
       `${baseUrl}/53787/${quarter}-${financialYear}/sanjay-gupta-portfolio/`,
       `${baseUrl}/53754/${quarter}-${financialYear}/dheeraj-kumar-lohia-and-associates-portfolio/`,
       `${baseUrl}/53779/${quarter}-${financialYear}/raj-kumar-lohia-portfolio/`,
       `${baseUrl}/53777/${quarter}-${financialYear}/porinju-v-veliyath-portfolio/`,
       `${baseUrl}/53799/${quarter}-${financialYear}/subramanian-p-portfolio/`,
       `${baseUrl}/62728/${quarter}-${financialYear}/ramesh-damani-portfolio/`,
       `${baseUrl}/584329/${quarter}-${financialYear}/nikhil-vora-portfolio/`
    ];

    //console.log('URLs to scrape:', urls);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    let tableData = [];

    for (let index = 0; index < urls.length; index++) {
        const result = await ScrapePage(page, urls[index]);
        tableData.push(...result);
    }

    await browser.close();

    res.json(tableData);
  } catch (err) {
    console.error('Error scraping Trendlyne:', err.message);
    res.status(500).json({ error: 'Failed to scrape data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/portfolio`);
});
