/* Opportunity CRUD routes (Project 4) — MySQL-backed, consumed
   by the browser frontend via fetch. */
import { Router } from "express";
import { opportunitiesDb } from "./db.js";
import { validateOpportunity } from "./validate.js";

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get("/", wrap(async (req, res) => {
  const { cause, search } = req.query;
  const data = await opportunitiesDb.list({ cause, search });
  res.status(200).json({ count: data.length, data });
}));

router.get("/:id", wrap(async (req, res) => {
  const item = await opportunitiesDb.find(req.params.id);
  if (!item) return res.status(404).json({ error: `No opportunity with id ${req.params.id}.` });
  res.status(200).json({ data: item });
}));

router.post("/", wrap(async (req, res) => {
  const errors = validateOpportunity(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  res.status(201).json({ message: "Opportunity created", data: await opportunitiesDb.create(req.body) });
}));

router.put("/:id", wrap(async (req, res) => {
  if (!(await opportunitiesDb.find(req.params.id)))
    return res.status(404).json({ error: `No opportunity with id ${req.params.id}.` });
  const errors = validateOpportunity(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  res.status(200).json({ message: "Opportunity updated", data: await opportunitiesDb.update(req.params.id, req.body) });
}));

router.patch("/:id", wrap(async (req, res) => {
  if (!(await opportunitiesDb.find(req.params.id)))
    return res.status(404).json({ error: `No opportunity with id ${req.params.id}.` });
  const errors = validateOpportunity(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  res.status(200).json({ message: "Opportunity updated", data: await opportunitiesDb.update(req.params.id, req.body) });
}));

router.post("/:id/signup", wrap(async (req, res) => {
  const result = await opportunitiesDb.signUp(req.params.id);
  if (result.status === "notfound")
    return res.status(404).json({ error: `No opportunity with id ${req.params.id}.` });
  if (result.status === "full")
    return res.status(409).json({ error: "This opportunity is already full.", data: result.row });
  res.status(200).json({ message: "Signed up", data: result.row });
}));

router.delete("/:id", wrap(async (req, res) => {
  if (!(await opportunitiesDb.remove(req.params.id)))
    return res.status(404).json({ error: `No opportunity with id ${req.params.id}.` });
  res.status(200).json({ message: `Opportunity ${req.params.id} deleted` });
}));

export default router;
