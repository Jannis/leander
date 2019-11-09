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

/**
 * Config types.
 */

export enum Order {
  asc,
  desc,
}

export type Column =
  | 'link'
  | 'number'
  | 'title'
  | 'severity'
  | 'age'
  | 'updated'
  | 'assigned'
  | 'phase'
  | 'source'
  | 'status'
  | 'triaged'
  | 'activity'
  | 'projects'
  | 'priority'
  | 'size'

export interface FieldOrder {
  field: string
  order: Order
}

export type Filter = any

export interface FlatView {
  columns: Column[]
  filter?: Filter
  pageSize?: number
  order: FieldOrder[]
}

export interface GroupedView {
  groupBy: string
  columns: Column[]
  filter?: Filter
  pageSize?: number
  order: FieldOrder[]
}

export interface Section {
  title: string
  flatView?: FlatView
  groupedView?: GroupedView
}

export interface Page {
  route: string
  title: string
  sections: Section[]
}

export interface Config {
  organization: string
  repositories: string[]
  pages: Page[]
}

/**
 * GraphQL schema for validation.
 */
export const schema = gql`
  scalar String
  scalar Int
  scalar Boolean
  scalar Any

  enum Column {
    link
    number
    title
    severity
    age
    updated
    assigned
    phase
    source
    status
    triaged
    activity
    projects
    priority
    size
  }

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
    flatView: FlatView
    groupedView: GroupedView
  }

  type FlatView {
    columns: [Column!]!
    filter: Any
    pageSize: Int
    order: [FieldOrder!]!
  }

  type GroupedView {
    groupBy: String!
    columns: [Column!]!
    filter: Any
    pageSize: Int
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

/**
 * Config validation using the GraphQL schema.
 */

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
    : scalarType.name.value === 'Any'
    ? []
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
