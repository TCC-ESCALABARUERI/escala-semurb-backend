// Valida body/params/query com Zod e entrega os dados já convertidos em req.valid
export const validate = schemas => (req, _res, next) => {
  req.valid = {}
  for (const key of ['body', 'params', 'query']) {
    if (schemas[key]) req.valid[key] = schemas[key].parse(req[key] ?? {})
  }
  next()
}
