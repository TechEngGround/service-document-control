const MinioConnector = require('../services/minio')

exports.uploadFile = async (req, res) => {
  console.log(req.file)
  if (!req.file || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded!')
  } else {
    const file = req.files.document;
    const uploadPath = `${__dirname}/uploads/${file.name}`
    file.mv(uploadPath, async (err) => {
      if (err) {
        return res.status(500).send(err)
      }

      const minioStatus = await MinioConnector.saveObject(uploadPath, file.name, req.body.userName)

      if (minioStatus.err) {
        return res.status(500).send(minioStatus.err)
      }

      res.status(200).send(`File uploaded with ID ${minioStatus.fileID}`)
    })
  }
}