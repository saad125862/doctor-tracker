// OpenAPI 3 description of the Doctor Tracker REST API. Served at /api-docs (Swagger UI) and /api-docs.json.

const id = { name: 'id', in: 'path', required: true, schema: { type: 'string', example: '6aeeb2ad51f6d9665f019bc3' }, description: 'MongoDB ObjectId' };

const listParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
  { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Case-insensitive prefix search' },
  { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Created on or after' },
  { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Created on or before' },
  { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'oldest', 'name'], default: 'newest' } },
];

const patientFilters = [
  { name: 'condition', in: 'query', schema: { type: 'string' } },
  { name: 'gender', in: 'query', schema: { type: 'string', enum: ['male', 'female', 'other'] } },
];

const ok = (description, schema) => ({ description, content: { 'application/json': { schema } } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const errors = {
  400: { $ref: '#/components/responses/ValidationError' },
  401: { $ref: '#/components/responses/Unauthorized' },
  404: { $ref: '#/components/responses/NotFound' },
};
const secured = [{ cookieAuth: [] }, { bearerAuth: [] }];

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Doctor Tracker API',
    version: '1.0.0',
    description:
      'REST API for managing doctors and their patients.\n\n**Authenticate:** call `POST /api/auth/login` below. The session cookie is set automatically, so protected endpoints work in "Try it out". ' +
      'You can also paste the returned `token` into **Authorize** as a Bearer token.',
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Auth' },
    { name: 'Dashboard' },
    { name: 'Custom fields' },
    { name: 'Doctors' },
    { name: 'Patients' },
    { name: 'System' },
  ],
  paths: {
    '/api/health': {
      get: { tags: ['System'], summary: 'Health check', responses: { 200: ok('Service is up', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) } },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        description: 'Verifies credentials and sets an httpOnly session cookie. Rate limited.',
        requestBody: { required: true, content: { 'application/json': { schema: ref('LoginBody') } } },
        responses: { 200: ok('Signed in', ref('LoginResponse')), 400: errors[400], 401: { description: 'Invalid email or password', content: { 'application/json': { schema: ref('Error') } } } },
      },
    },
    '/api/auth/demo': {
      post: {
        tags: ['Auth'],
        summary: 'Demo sign-in (one click)',
        description: 'Signs in as the seeded admin. Only available when the server runs with `DEMO_MODE=true`, otherwise 404.',
        responses: { 200: ok('Signed in', ref('LoginResponse')), 404: errors[404] },
      },
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Sign out (clears the cookie)', responses: { 200: ok('Signed out', { type: 'object', properties: { ok: { type: 'boolean' } } }) } } },
    '/api/auth/me': { get: { tags: ['Auth'], summary: 'Current user', security: secured, responses: { 200: ok('Current user', { type: 'object', properties: { user: ref('User') } }), 401: errors[401] } } },

    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard analytics',
        description: 'Totals, daily timeline, patients per doctor (top 10), top conditions, gender split and recent patients.',
        security: secured,
        parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', minimum: 7, maximum: 365, default: 30 } }],
        responses: { 200: ok('Aggregated stats', ref('DashboardStats')), 401: errors[401] },
      },
    },

    '/api/custom-fields': {
      get: {
        tags: ['Custom fields'],
        summary: 'List custom fields',
        description: 'Admin-defined extra fields for the doctor or patient forms, in display order. Archived fields are not returned.',
        security: secured,
        parameters: [{ name: 'entity', in: 'query', schema: { type: 'string', enum: ['doctor', 'patient'] } }],
        responses: { 200: ok('Fields', { type: 'object', properties: { data: { type: 'array', items: ref('CustomField') } } }), 401: errors[401] },
      },
      post: {
        tags: ['Custom fields'],
        summary: 'Create a custom field',
        description: 'Types: text, longtext, number, date, dropdown (needs `options`), boolean. The storage key is generated from the label.',
        security: secured,
        requestBody: { required: true, content: { 'application/json': { schema: ref('CustomFieldInput') } } },
        responses: { 201: ok('Created', { type: 'object', properties: { data: ref('CustomField') } }), 400: errors[400], 401: errors[401] },
      },
    },
    '/api/custom-fields/reorder': {
      put: {
        tags: ['Custom fields'],
        summary: 'Reorder custom fields',
        security: secured,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['entity', 'ids'], properties: { entity: { type: 'string', enum: ['doctor', 'patient'] }, ids: { type: 'array', items: { type: 'string' } } } } } },
        },
        responses: { 200: ok('Reordered', { type: 'object', properties: { ok: { type: 'boolean' } } }), 400: errors[400], 401: errors[401] },
      },
    },
    '/api/custom-fields/{id}': {
      patch: {
        tags: ['Custom fields'],
        summary: 'Edit a custom field',
        description: 'The type and key cannot change. Options can only be sent for dropdown fields.',
        security: secured,
        parameters: [id],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { label: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, required: { type: 'boolean' } } } } },
        },
        responses: { 200: ok('Updated', { type: 'object', properties: { data: ref('CustomField') } }), 400: errors[400], 401: errors[401], 404: errors[404] },
      },
      delete: {
        tags: ['Custom fields'],
        summary: 'Delete (archive) a custom field',
        description: 'Hides the field everywhere. Values already saved on doctors and patients are kept.',
        security: secured,
        parameters: [id],
        responses: { 200: ok('Archived', { type: 'object', properties: { ok: { type: 'boolean' } } }), 401: errors[401], 404: errors[404] },
      },
    },

    '/api/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List doctors',
        description: 'Searchable (name, specialization, hospital), filterable and paginated.',
        security: secured,
        parameters: [
          ...listParams,
          { name: 'specialization', in: 'query', schema: { type: 'string' } },
          { name: 'hospital', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: ok('Page of doctors', { type: 'object', properties: { data: { type: 'array', items: ref('Doctor') }, meta: ref('PageMeta') } }), 400: errors[400], 401: errors[401] },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Create a doctor',
        security: secured,
        requestBody: { required: true, content: { 'application/json': { schema: ref('DoctorInput') } } },
        responses: { 201: ok('Created', { type: 'object', properties: { data: ref('Doctor') } }), 400: errors[400], 401: errors[401], 409: { description: 'Email already exists', content: { 'application/json': { schema: ref('Error') } } } },
      },
    },
    '/api/doctors/filters': {
      get: {
        tags: ['Doctors'],
        summary: 'Filter options',
        description: 'Distinct specializations and hospitals, for dropdowns.',
        security: secured,
        responses: { 200: ok('Options', { type: 'object', properties: { specializations: { type: 'array', items: { type: 'string' } }, hospitals: { type: 'array', items: { type: 'string' } } } }), 401: errors[401] },
      },
    },
    '/api/doctors/{id}': {
      get: { tags: ['Doctors'], summary: 'Get a doctor', security: secured, parameters: [id], responses: { 200: ok('Doctor with patient count', { type: 'object', properties: { data: ref('Doctor') } }), 401: errors[401], 404: errors[404] } },
      delete: { tags: ['Doctors'], summary: 'Delete a doctor and all their patients', security: secured, parameters: [id], responses: { 200: ok('Deleted', { type: 'object', properties: { ok: { type: 'boolean' } } }), 401: errors[401], 404: errors[404] } },
    },
    '/api/doctors/{id}/patients': {
      get: {
        tags: ['Doctors'],
        summary: "List a doctor's patients",
        security: secured,
        parameters: [id, ...listParams, ...patientFilters],
        responses: { 200: ok('Page of patients', { type: 'object', properties: { data: { type: 'array', items: ref('Patient') }, meta: ref('PageMeta') } }), 401: errors[401] },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Add a patient under this doctor',
        security: secured,
        parameters: [id],
        requestBody: { required: true, content: { 'application/json': { schema: ref('PatientInput') } } },
        responses: { 201: ok('Created', { type: 'object', properties: { data: ref('Patient') } }), 400: errors[400], 401: errors[401], 404: errors[404] },
      },
    },

    '/api/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List all patients',
        description: 'Searchable (name, condition), filterable by condition, gender, doctor and date, and paginated.',
        security: secured,
        parameters: [...listParams, ...patientFilters, { name: 'doctor', in: 'query', schema: { type: 'string' }, description: 'Doctor id' }],
        responses: { 200: ok('Page of patients', { type: 'object', properties: { data: { type: 'array', items: ref('Patient') }, meta: ref('PageMeta') } }), 400: errors[400], 401: errors[401] },
      },
    },
    '/api/patients/conditions': {
      get: { tags: ['Patients'], summary: 'Distinct conditions', security: secured, responses: { 200: ok('Conditions', { type: 'object', properties: { conditions: { type: 'array', items: { type: 'string' } } } }), 401: errors[401] } },
    },
    '/api/patients/{id}': {
      patch: {
        tags: ['Patients'],
        summary: 'Edit a patient',
        security: secured,
        parameters: [id],
        requestBody: { required: true, content: { 'application/json': { schema: ref('PatientUpdate') } } },
        responses: { 200: ok('Updated', { type: 'object', properties: { data: ref('Patient') } }), 400: errors[400], 401: errors[401], 404: errors[404] },
      },
      delete: { tags: ['Patients'], summary: 'Delete a patient', security: secured, parameters: [id], responses: { 200: ok('Deleted', { type: 'object', properties: { ok: { type: 'boolean' } } }), 401: errors[401], 404: errors[404] } },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'dt_token', description: 'Set automatically by POST /api/auth/login' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Use the `token` from the login response' },
    },
    responses: {
      Unauthorized: { description: 'Missing or invalid session', content: { 'application/json': { schema: ref('Error'), example: { message: 'Authentication required' } } } },
      NotFound: { description: 'Not found', content: { 'application/json': { schema: ref('Error'), example: { message: 'Doctor not found' } } } },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Validation failed' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } } } } } },
      },
    },
    schemas: {
      Error: { type: 'object', properties: { message: { type: 'string' } } },
      PageMeta: { type: 'object', properties: { total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' }, totalPages: { type: 'integer' } } },
      LoginBody: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'admin@example.com' }, password: { type: 'string', example: 'Admin@12345' } } },
      User: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string', example: 'admin' } } },
      LoginResponse: { type: 'object', properties: { user: ref('User'), token: { type: 'string', description: 'JWT (also set as httpOnly cookie)' } } },
      CustomValues: {
        type: 'object',
        description: 'Values for custom fields, keyed by the field `key` (see GET /api/custom-fields). Required fields must be present on create.',
        additionalProperties: true,
        example: { years_of_experience: 12, blood_group: 'O+' },
      },
      CustomFieldInput: {
        type: 'object',
        required: ['entity', 'label', 'type'],
        properties: {
          entity: { type: 'string', enum: ['doctor', 'patient'] },
          label: { type: 'string', example: 'Blood group' },
          type: { type: 'string', enum: ['text', 'longtext', 'number', 'date', 'dropdown', 'boolean'] },
          options: { type: 'array', items: { type: 'string' }, example: ['A+', 'B+', 'O+', 'AB+'], description: 'Required (at least one) for dropdown fields' },
          required: { type: 'boolean', default: false },
        },
      },
      CustomField: {
        allOf: [
          ref('CustomFieldInput'),
          { type: 'object', properties: { _id: { type: 'string' }, key: { type: 'string', example: 'blood_group' }, order: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' } } },
        ],
      },
      DoctorInput: {
        type: 'object',
        required: ['name', 'specialization', 'hospital', 'phone', 'email'],
        properties: { name: { type: 'string', example: 'Dr. Jane Smith' }, specialization: { type: 'string', example: 'Cardiology' }, hospital: { type: 'string', example: 'City General' }, phone: { type: 'string', example: '+92 300 1234567' }, email: { type: 'string', format: 'email' }, custom: ref('CustomValues') },
      },
      Doctor: {
        allOf: [ref('DoctorInput'), { type: 'object', properties: { _id: { type: 'string' }, patientCount: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }],
      },
      PatientInput: {
        type: 'object',
        required: ['name', 'age', 'gender', 'condition'],
        properties: { name: { type: 'string', example: 'Aisha Khan' }, age: { type: 'integer', minimum: 0, maximum: 130, example: 34 }, gender: { type: 'string', enum: ['male', 'female', 'other'] }, condition: { type: 'string', example: 'Hypertension' }, phone: { type: 'string' }, custom: ref('CustomValues') },
      },
      PatientUpdate: {
        type: 'object',
        description: 'Any subset of the patient fields, optionally reassigning to another doctor.',
        properties: { name: { type: 'string' }, age: { type: 'integer' }, gender: { type: 'string', enum: ['male', 'female', 'other'] }, condition: { type: 'string' }, phone: { type: 'string' }, doctor: { type: 'string', description: 'Doctor id' }, custom: { allOf: [ref('CustomValues')], description: 'Only the keys sent are changed; an empty value clears that key.' } },
      },
      Patient: {
        allOf: [
          ref('PatientInput'),
          { type: 'object', properties: { _id: { type: 'string' }, doctor: { description: 'Doctor id, or { _id, name, specialization } when populated', oneOf: [{ type: 'string' }, { type: 'object' }] }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
        ],
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totals: { type: 'object', properties: { doctors: { type: 'integer' }, patients: { type: 'integer' }, avgPatientsPerDoctor: { type: 'number' }, newPatients: { type: 'integer' }, newDoctors: { type: 'integer' } } },
          days: { type: 'integer' },
          timeline: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, patients: { type: 'integer' }, doctors: { type: 'integer' } } } },
          patientsPerDoctor: { type: 'array', items: { type: 'object', properties: { doctorId: { type: 'string' }, name: { type: 'string' }, specialization: { type: 'string' }, patients: { type: 'integer' } } } },
          conditions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'integer' } } } },
          genders: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'integer' } } } },
          recentPatients: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
};
