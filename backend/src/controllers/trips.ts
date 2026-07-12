import { Request, Response } from 'express';
import { Trip } from '../models/Trip';

export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips.map(trip => ({ ...trip.toObject(), id: trip._id.toString() })));
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    res.status(201).json({ ...trip.toObject(), id: trip._id.toString() });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Add logic for dispatching/completing if status changed
    if (req.body.status === 'DISPATCHED' && !req.body.dispatched_at) {
      req.body.dispatched_at = new Date();
    }
    if (req.body.status === 'COMPLETED' && !req.body.completed_at) {
      req.body.completed_at = new Date();
    }

    const trip = await Trip.findByIdAndUpdate(id, req.body, { new: true });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ ...trip.toObject(), id: trip._id.toString() });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
