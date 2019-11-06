import gql from 'graphql-tag'
import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  TypeNode,
  TypeSystemDefinitionNode,
  print,
  ScalarTypeDefinitionNode,
  UnionTypeDefinitionNode,
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
    sections: [Section!]!
  }

  type Section {
    title: String
    viewType: String! # should be an enum
    view: View!
  }

  union View = FlatView

  type FlatView {
    order: [FieldOrder!]!
  }

  type FieldOrder {
    field: String!
    order: Order!
  }

  enum Order {
    asc
    desc
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

const validateUnion = (
  path: string[],
  value: any,
  {
    unionType,
    schema,
  }: {
    unionType: UnionTypeDefinitionNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate union', path, value)

  for (let namedType of unionType.types) {
    let errors = validateValue(path, value, { type: namedType, schema })
    if (errors.length === 0) {
      return []
    }
  }

  return [
    error(
      path,
      `value is not one of [${unionType.types.map(t => t.name)}]: ${JSON.stringify(
        value,
      )}`,
    ),
  ]
}

const validateNamedType = (
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
    : typeDef.kind === 'UnionTypeDefinition'
    ? validateUnion(path, value, { unionType: typeDef, schema })
    : []
}

const validateArray = (
  path: string[],
  values: any[],
  {
    type,
    schema,
  }: {
    type: TypeNode
    schema: DocumentNode
  },
): ValidationError[] => {
  console.log('Validate array', path, values)

  return values.reduce(
    (errors, value, index) =>
      errors.concat(validateValue([...path, `${index}`], value, { type, schema })),
    [],
  )
}

const validateValue = (
  path: string[],
  value: any,
  {
    type,
    schema,
    nonNull,
  }: {
    type: TypeNode
    schema: DocumentNode
    nonNull?: boolean
  },
): ValidationError[] => {
  console.log('Validate value', path, value)

  if (nonNull && (value === null || value === undefined)) {
    return [error(path, 'value must not be null')]
  }

  if (!nonNull && (value === null || value === undefined)) {
    return []
  }

  return type.kind === 'NonNullType'
    ? value != null && value !== undefined
      ? validateValue(path, value, { type: type.type, schema, nonNull: true })
      : [error(path, 'value must not be null')]
    : type.kind === 'ListType'
    ? Array.isArray(value)
      ? validateArray(path, value, { type: type.type, schema })
      : [error(path, 'value must be an array')]
    : validateNamedType(path, value, { typeName: type.name.value, schema })
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
      ...validateValue([...path, field.name.value], o[field.name.value], {
        type: field.type,
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
