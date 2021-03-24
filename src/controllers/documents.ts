import { generatePDF } from './pdfgen'
import MinioConnector from '../services/minio'
import moment from 'moment'
import {
  contractText,
  procuracao,
  // contractTextMaternidade,
  // contractTextRevisao,
  aceiteContract,
} from '../util/template'

import Express from 'express'
import 'moment/locale/pt-br'

moment.locale('pt-BR')

export async function generateAceitePDF(req: Express.Request, res: Express.Response) {
  try {
    await generatePDF(
      aceiteContract
        .replace(/{{siteUrl}}/g, 'http://localhost:3000')
        .replace(/{{name}}/g, req.body.name)
        .replace(/{{nacionalidade}}/g, 'Brasileiro(a)')
        .replace(/{{estadocivil}}/g, req.body.marital_status)
        .replace(/{{cpf}}/g, req.body.cpf)
        .replace(/{{rg}}/g, req.body.rg)
        .replace(/{{endereco}}/g, req.body.address)
        .replace(/{{cep}}/g, req.body.zipcode)
        .replace(/{{currentDate}}/g, moment().locale('pt-BR').format('LL')),
      `Aceite-${req.body.name}`,
    )

    const minioClient = new MinioConnector()
    const response = await minioClient.saveObjectforSign(
      `pdfgen/Aceite-${req.body.name}.pdf`,
      `Aceite-${req.body.name}.pdf`,
      req.params.clientId,
      'ASSINATURA - ACEITE',
    )

    return res.status(200).json(response)
  } catch (err) {
    return res.status(500).json({ status: err })
  }
}

export async function generateContractPDF(req: Express.Request, res: Express.Response) {
  try {
    await generatePDF(
      contractText
        .replace(/{{siteUrl}}/g, 'http://localhost:3000')
        .replace(/{{name}}/g, req.body.name)
        .replace(/{{nacionalidade}}/g, 'Brasileiro(a)')
        .replace(/{{estadocivil}}/g, req.body.marital_status)
        .replace(/{{cpf}}/g, req.body.cpf)
        .replace(/{{rg}}/g, req.body.rg)
        .replace(/{{endereco}}/g, req.body.address)
        .replace(/{{cep}}/g, req.body.zipcode)
        .replace(/{{currentDate}}/g, moment().locale('pt-BR').format('LL')),
      `Contrato-${req.body.name}`,
    )
    const minioClient = new MinioConnector()
    const response = await minioClient.saveObjectforSign(
      `pdfgen/Contrato-${req.body.name}.pdf`,
      `Contrato-${req.body.name}.pdf`,
      req.params.clientId,
      'ASSINATURA - CONTRATO DE PRESTAÇÃO',
    )
    return res.status(200).json(response)
  } catch (err) {
    return res.status(500).json(err)
  }
}

export async function generateProcuracaoPDF(req: Express.Request, res: Express.Response) {
  try {
    await generatePDF(
      procuracao
        .replace(/{{siteUrl}}/g, 'http://localhost:3000')
        .replace(/{{name}}/g, req.body.name)
        .replace(/{{nacionalidade}}/g, 'Brasileiro(a)')
        .replace(/{{estadocivil}}/g, req.body.marital_status)
        .replace(/{{cpf}}/g, req.body.cpf)
        .replace(/{{rg}}/g, req.body.rg)
        .replace(/{{endereco}}/g, req.body.address)
        .replace(/{{cep}}/g, req.body.zipcode)
        .replace(/{{currentDate}}/g, moment().locale('pt-BR').format('LL')),
      `Procuracao-${req.body.name}`,
    )

    const minioClient = new MinioConnector()

    const response = await minioClient.saveObjectforSign(
      `pdfgen/Procuracao-${req.body.name}.pdf`,
      `Procuracao-${req.body.name}.pdf`,
      req.params.clientId,
      'ASSINATURA - PROCURAÇÃO',
    )

    return res.status(200).json(response)
  } catch (err) {
    return res.status(500).json(err)
  }
}
