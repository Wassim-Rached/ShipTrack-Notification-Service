import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import NodeCache from "node-cache";

type Notification = {
  id: string;
  shipment_id: string;
  message: string;
  status: string;
  created_at: string;
};

dotenv.config();

const db = new NodeCache({ stdTTL: 86400 });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/service/notifications", async (req: Request, res: Response) => {
  try {
    const requiredFields = ["shipment_id", "status", "message"];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      res
        .status(400)
        .json({ error: `Missing fields: ${missingFields.join(", ")}` });
      return;
    }

    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      shipment_id: req.body.shipment_id,
      message: req.body.message,
      status: req.body.status,
      created_at: new Date().toISOString(),
    };

    const newShipment = db.set(notification.id, notification);
    res.status(201).json(newShipment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/service/notifications/:id", async (req: Request, res: Response) => {
  try {
    const shipmentId = req.params.id;

    if (!shipmentId) {
      res.status(400).json({ error: "Shipment ID is required" });
      return;
    }

    const shipments: Notification[] = Object.values(db.mget(db.keys())).filter(
      (notification) => (notification as Notification).shipment_id == shipmentId
    ) as Notification[];

    res.json(shipments);
  } catch (error: any) {
    console.error("Error getting shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
