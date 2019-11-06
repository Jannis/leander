import gql from 'graphql-tag'
import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  TypeNode,
  TypeSystemDefinitionNode,
  print,
  ScalarTypeDefinitionNode,
} from 'graphql'

export const schema = gql`
  scalar String
  scalar Int
  scalar Boolean

  type Config {
    organization: String!
    repositories: [String!]!
    pages: [Page!]!
  }

  type Page {
    route: String!
    title: String!
  }
`

export type ValidationError = {
  path: string[]
  msg: string
}

const error = (path: string[], msg: string) => ({
  path,
  msg,
})

const unwrapFieldType = (type: TypeNode, schema: DocumentNode, nonNull?: boolean) =>
  type.kind === 'NonNullType'
    ? unwrapFieldType(type.type, schema, true)
    : type.kind === 'ListType'
    ? unwrapFieldType(type.type, schema, nonNull || false)
    : {
        innerType: schema.definitions.find(
          (def: any) => def.name.value === type.name.value,
        ),
        nonNull,
      }

const validateScalar = (
  path: string[],
  value: any,
  {
    scalarType,
    schema,
  }: {
    scalarType: ScalarTypeDefinitionNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate scalar', path, value)

  return scalarType.name.value === 'String'
    ? typeof value === 'string'
      ? []
      : [error(path, `value is not a string: ${JSON.stringify(value)}`)]
    : scalarType.name.value === 'Boolean'
    ? typeof value === 'boolean'
      ? []
      : [error(path, `value is not a boolean: ${JSON.stringify(value)}`)]
    : scalarType.name.value === 'Int'
    ? typeof value === 'number' && Number.isInteger(value)
      ? []
      : [error(path, `value is not an int: ${JSON.stringify(value)}`)]
    : [error(path, `unsupported scalar type: ${scalarType.name.value}`)]
}

const validateValue = (
  path: string[],
  value: any,
  {
    typeName,
    schema,
  }: {
    typeName: string
    schema: DocumentNode
  },
): ValidationError[] => {
  let typeDef = schema.definitions.find((def: any) => def.name.value === typeName)

  if (!typeDef) {
    return [error(path, `unknown type: ${typeName}`)]
  }

  return typeDef.kind === 'ObjectTypeDefinition'
    ? validateObject(path, value, { objectType: typeDef, schema })
    : typeDef.kind === 'ScalarTypeDefinition'
    ? validateScalar(path, value, { scalarType: typeDef, schema })
    : []
}

const validateArray = (
  path: string[],
  values: any[],
  {
    fieldType,
    schema,
  }: {
    fieldType: TypeNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate array', path, values)

  return values.reduce(
    (errors, value, index) =>
      errors.concat(validateField([...path, `${index}`], value, { fieldType, schema })),
    [],
  )
}

const validateField = (
  path: string[],
  value: any,
  {
    fieldType,
    schema,
  }: {
    fieldType: TypeNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate field', path, value)

  return fieldType.kind === 'NonNullType'
    ? value != null
      ? validateField(path, value, { fieldType: fieldType.type, schema })
      : [error(path, 'value must not be null')]
    : fieldType.kind === 'ListType'
    ? Array.isArray(value)
      ? validateArray(path, value, { fieldType: fieldType.type, schema })
      : [error(path, 'value must be an array')]
    : validateValue(path, value, { typeName: fieldType.name.value, schema })
}

const validateObject = (
  path: string[],
  o: any,
  {
    objectType,
    schema,
  }: {
    objectType: ObjectTypeDefinitionNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate', path, o)

  if (typeof o !== 'object') {
    return [error(path, 'not an object')]
  }

  let errors = []
  for (let field of objectType.fields) {
    errors.push(
      ...validateField([...path, field.name.value], o[field.name.value], {
        fieldType: field.type,
        schema,
      }),
    )
  }
  return errors
}

export const validateConfig = (config: any): ValidationError[] => {
  let errors = []

  let rootPath = ['/']
  let objectType = schema.definitions.find(def => def.name.value === 'Config')
  errors.push(...validateObject(rootPath, config, { objectType, schema }))

  return errors
}
