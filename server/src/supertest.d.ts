declare module "supertest" {
  import { Application } from "express";
  function request(app: Application): any;
  export default request;
}
