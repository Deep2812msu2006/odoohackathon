import { Request, Response } from 'express';
import { Driver } from '../models/Driver';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const newDriver = await Driver.create(req.body);
    res.status(201).json(newDriver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDriver) return res.status(404).json({ error: 'Driver not found' });
    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedDriver = await Driver.findByIdAndDelete(id);
    if (!deletedDriver) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
