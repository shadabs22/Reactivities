import axios, { AxiosResponse } from "axios";
import { Activity } from "../layout/models/activity";

const responseBody = <T>(response: AxiosResponse<T>) => response.data;
const sleep = async (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

axios.defaults.baseURL = "http://localhost:5000/api";

axios.interceptors.response.use(async (response) => {
  return await sleep(1000)
    .then(() => {
      return response;
    })
    .catch((error) => {
      console.log(error);
      return Promise.reject(error);
    });
});

const requests = {
  get: <T>(url: string) => axios.get<T>(url).then(responseBody),
  post: <T>(url: string, body: {}) =>
    axios.post<T>(url, body).then(responseBody),
  put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
  del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
};

const Activities = {
  list: () => requests.get<Activity[]>("/activities"),
  details: (id: string) => requests.get(`/activities/${id}`),
  create: (activity: Activity) => axios.post("/activities", activity),
  update: (activity: Activity) =>
    axios.put(`/activities/${activity.id}`, activity),
  delete: (id: string) => axios.delete(`/activities/${id}`),
};

const agent = {
  Activities,
};
export default agent;
