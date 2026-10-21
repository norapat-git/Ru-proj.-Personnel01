//const baseUrl = 'http://localhost:4000/api/service/frontend';
const baseUrl = 'https://uat3.ru.ac.th/personnel-api/api/service/frontend';

export const environment = {
  production: false,
  apiUrl: `${baseUrl}/personnel`,
  signUrl: `${baseUrl}/sign`,
  portalLoginUrl: 'https://uat3.ru.ac.th',
  secret_key: '1234'
};
