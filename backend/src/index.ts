import express, { Request, Response } from 'express';
import cors from 'cors'; 

const app = express();

app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

interface SavedData {
  csvData: Array<{ [key: string]: string }>;
  filterValues: { [key: string]: string };
}

let savedData: SavedData = { csvData: [], filterValues: {} };

app.post('/', (req: Request, res: Response) => 
{
  savedData = req.body; 
  res.sendStatus(200);
});

app.get('/', (req: Request, res: Response) => 
{
  savedData
   ? res.json(savedData)
   : res.status(404).send('No data found');
});

app.listen(5000, () => console.log('Server running on port 5000'));