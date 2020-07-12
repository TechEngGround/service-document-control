# SERVIÇO DE CONTROLE DOS DOCUMENTOS

## DESCRIÇÃO
Serviço responsável pelo download e upload dos arquivos, e também envio para o object storage.

## TECNOLOGIAS UTILIZADAS
1. Node
1. Express
1. Minio (Object Storage)
1. Minio-JS (https://github.com/minio/minio-js)
1. Docker

## Rotas
1. POST /files/upload
    * Entradas:
        * Body:  ```json {"userId": "database-user-id"}```
    * Retorno:
        * Status <span style="color:green">200</span> - Sucesso no upload. ```json {"fileId": "storage-file-id"}```
        * Status <span style="color:yellow">400</span> - userId não está presente no Body da requisição. ```json {"message": "parâmetros faltando"}```
        * Status <span style="color:red">500</span> - Erro interno do servidor. ```json {"message": "erro"}``` 
1. GET /files/download?userId=&filename=&filetype=
    * Entradas:
        * userId - Representa o id do usuário no Banco de Dados, o serviço irá verificar se o id enviado é mesmo presente nos metadados do documento buscado.
        * filename - Nome do arquivo requisitado.
        * filetype - Extensão do arquivo requisitado.
    * Retorno:
        * Status <span style="color:green">200</span> - Objeto para download.
        * Status <span style="color:yellow">400</span> - Algum dos parâmetros está faltando na Query String. ```json {"message": "parâmetros faltando"}```
        * Status <span style="color:red">500</span> - Erro interno do servidor. ```json {"message": "erro"}```