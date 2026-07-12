import { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const newVehicle = await Vehicle.create(req.body);
    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);
    
    if (!deletedVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
