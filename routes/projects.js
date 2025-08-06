const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new project
router.post('/', async (req, res) => {
    try {
        const project = new Project({
            title: req.body.title,
            description: req.body.description
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add task to project
router.post('/:projectId/tasks', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        project.tasks.push({
            title: req.body.title,
            description: req.body.description
        });
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add subtask to task
router.post('/:projectId/tasks/:taskId/subtasks', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        task.subtasks.push({
            title: req.body.title,
            description: req.body.description
        });
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Helper function to check if project is fully completed
const isProjectCompleted = (project) => {
    if (project.tasks.length === 0) return false;
    
    return project.tasks.every(task => {
        if (!task.completed) return false;
        if (task.subtasks.length === 0) return true;
        return task.subtasks.every(subtask => subtask.completed);
    });
};

// Toggle task completion
router.patch('/:projectId/tasks/:taskId/toggle', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        task.completed = !task.completed;
        await project.save();
        
        // Check if project is fully completed and delete if so
        if (isProjectCompleted(project)) {
            await Project.findByIdAndDelete(req.params.projectId);
            return res.json({ deleted: true, message: 'Project completed and removed!' });
        }
        
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Toggle subtask completion
router.patch('/:projectId/tasks/:taskId/subtasks/:subtaskId/toggle', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        const subtask = task.subtasks.id(req.params.subtaskId);
        subtask.completed = !subtask.completed;
        await project.save();
        
        // Check if project is fully completed and delete if so
        if (isProjectCompleted(project)) {
            await Project.findByIdAndDelete(req.params.projectId);
            return res.json({ deleted: true, message: 'Project completed and removed!' });
        }
        
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update notes
router.patch('/:projectId/tasks/:taskId/notes', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        task.notes = req.body.notes;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch('/:projectId/tasks/:taskId/subtasks/:subtaskId/notes', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const task = project.tasks.id(req.params.taskId);
        const subtask = task.subtasks.id(req.params.subtaskId);
        subtask.notes = req.body.notes;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Import project from JSON
router.post('/import', async (req, res) => {
    try {
        console.log('Importing project data:', req.body);
        const { projectData } = req.body;
        console.log('Importing project data:', projectData);
        // Validate the imported data structure
        if (!projectData.title) {
            return res.status(400).json({ error: 'Project must have a title' });
        }

        // Create new project from imported data
        const project = new Project({
            title: projectData.title,
            description: projectData.description || '',
            tasks: projectData.tasks || []
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Export project as JSON
router.get('/:projectId/export', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Remove MongoDB-specific fields for cleaner export
        const exportData = {
            title: project.title,
            description: project.description,
            tasks: project.tasks.map(task => ({
                title: task.title,
                description: task.description,
                notes: task.notes,
                completed: task.completed,
                subtasks: task.subtasks.map(subtask => ({
                    title: subtask.title,
                    description: subtask.description,
                    notes: subtask.notes,
                    completed: subtask.completed
                }))
            })),
            exportedAt: new Date().toISOString()
        };

        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
