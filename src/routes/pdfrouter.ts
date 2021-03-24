import Express from 'express'
import bodyParser from 'body-parser'
import {
  generateAceitePDF,
  generateContractPDF,
  generateProcuracaoPDF,
} from '../controllers/documents'

// eslint-disable-next-line new-cap
const pdfRouter = Express.Router()
// const jsonParser = bodyParser.json()

pdfRouter.use(bodyParser.urlencoded({ extended: false }))

pdfRouter.post('/generateContractPDF/:clientId', generateContractPDF)
pdfRouter.post('/generateProcuracaoPDF/:clientId', generateProcuracaoPDF)
pdfRouter.post('/generateAceitePDF/:clientId', generateAceitePDF)

export default pdfRouter
