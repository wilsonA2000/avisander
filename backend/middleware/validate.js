function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source])
      req[source] = parsed
      next()
    } catch (err) {
      next(err) // delegado al error handler central (maneja ZodError)
    }
  }
}

module.exports = { validate }
