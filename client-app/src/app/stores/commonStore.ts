import { makeAutoObservable } from "mobx";
import { ServerError } from "../models/serverError";

export default class CommonStore {
  error: ServerError = {statusCode:0, message:"", details:""};
  constructor() {
    makeAutoObservable(this);
  }
  setServerError(error: ServerError) {
    this.error = error;
  }
}
