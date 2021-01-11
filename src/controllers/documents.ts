import { generatePDF } from "./pdfgen"
import MinioConnector from "../services/minio";
import moment from "moment"
import {
    contractText,
    procuracao,
    // contractTextMaternidade,
    // contractTextRevisao,
    aceiteContract,
  } from "../util/template"

import Express from "express"

export async function generateAceitePDF(req: Express.Request, res: Express.Response) {
    try {
      await generatePDF(
        aceiteContract
          .replace(/{{siteUrl}}/g, "http://localhost:3000")
          .replace(/{{name}}/g, req.body.name)
          .replace(/{{nacionalidade}}/g, "Brasileiro(a)")
          .replace(/{{estadocivil}}/g, req.body.marital_status)
          .replace(/{{cpf}}/g, req.body.cpf)
          .replace(/{{rg}}/g, req.body.rg)
          .replace(/{{endereco}}/g, req.body.address)
          .replace(/{{cep}}/g, req.body.zipcode)
          .replace(/{{currentDate}}/g, moment().format("LL")),
        `Aceite-${req.params.clientId}`,
      )

      const minioClient = new MinioConnector();
      const response = await minioClient.saveObjectforSign(
          `pdfgen/Aceite-${req.params.clientId}.pdf`,
          `Aceite-${req.params.clientId}.pdf`,
          req.params.clientId,
          'ASSINATURA - ACEITE',
        );
            
      return res.status(200).json(response)
    } catch (err) {
      return res.status(500).json({ status: err })
    }
  }

  export async function generateContractPDF(req: Express.Request, res: Express.Response) {
    try {
      await generatePDF(
        contractText
          .replace(/{{siteUrl}}/g, "http://localhost:3000")
          .replace(/{{name}}/g, req.body.name)
          .replace(/{{nacionalidade}}/g, "Brasileiro(a)")
          .replace(/{{estadocivil}}/g, req.body.marital_status)
          .replace(/{{cpf}}/g, req.body.cpf)
          .replace(/{{rg}}/g, req.body.rg)
          .replace(/{{endereco}}/g, req.body.address)
          .replace(/{{cep}}/g, req.body.zipcode)
          .replace(/{{currentDate}}/g, moment().format("LL")),
        `Contrato-${req.params.clientId}`,
      )
      const minioClient = new MinioConnector();
      const response = await minioClient.saveObjectforSign(
          `pdfgen/Contrato-${req.params.clientId}.pdf`,
          `Contrato-${req.params.clientId}.pdf`,
          req.params.clientId,
          'ASSINATURA - CONTRATO DE PRESTAÇÃO',
        );
      return res.status(200).json(response)
    } catch (err) {
      return res.status(500).json(err)
    }
  }

  export async function generateProcuracaoPDF(req: Express.Request, res: Express.Response) {
    try {
      await generatePDF(
        procuracao
          .replace(/{{siteUrl}}/g, "http://localhost:3000")
          .replace(/{{name}}/g, req.body.name)
          .replace(/{{nacionalidade}}/g, "Brasileiro(a)")
          .replace(/{{estadocivil}}/g, req.body.marital_status)
          .replace(/{{cpf}}/g, req.body.cpf)
          .replace(/{{rg}}/g, req.body.rg)
          .replace(/{{endereco}}/g, req.body.address)
          .replace(/{{cep}}/g, req.body.zipcode)
          .replace(/{{currentDate}}/g, moment().format("LL")),
        `Procuracao-${req.params.clientId}`,
      )
      
      const minioClient = new MinioConnector();
      
      const response = await minioClient.saveObjectforSign(
          `pdfgen/Procuracao-${req.params.clientId}.pdf`,
          `Procuracao-${req.params.clientId}.pdf`,
          req.params.clientId,
          'ASSINATURA - PROCURAÇÃO',
        );

      return res.status(200).json(response)
    } catch (err) {
      return res.status(500).json(err)
    }
  }