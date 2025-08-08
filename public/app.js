class WilpApp {
    constructor() {
        this.projects = [];
        this.currentEditingNotes = null;
        this.completionSound = document.getElementById('completion-sound');
        this.timerDuration = 25 * 60; // 25 minutes
        this.breakDuration = 5 * 60; // 5 minutes
        this.timeLeft = this.timerDuration;
        this.timerMode = 'work';
        this.timerInterval = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProjects();
        this.updateTimerDisplay();
    }

    bindEvents() {
        // New project button
        document.getElementById('new-project-btn').addEventListener('click', () => {
            this.showProjectModal();
        });

        // Import project button
        document.getElementById('import-project-btn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Project modal events
        document.getElementById('generate-tasks-btn').addEventListener('click', () => {
            this.generateProject();
        });

        document.getElementById('cancel-project-btn').addEventListener('click', () => {
            this.hideProjectModal();
        });

        // Import modal events
        document.getElementById('import-btn').addEventListener('click', () => {
            this.importProject();
        });

        document.getElementById('cancel-import-btn').addEventListener('click', () => {
            this.hideImportModal();
        });

        // Notes modal events
        document.getElementById('save-notes-btn').addEventListener('click', () => {
            this.saveNotes();
        });

        document.getElementById('cancel-notes-btn').addEventListener('click', () => {
            this.hideNotesModal();
        });

        // Details modal events
        document.getElementById('close-details-btn').addEventListener('click', () => {
            this.hideDetailsModal();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Pomodoro timer events
        document.getElementById('start-timer').addEventListener('click', () => {
            this.toggleTimer();
        });

        document.getElementById('reset-timer').addEventListener('click', () => {
            this.resetTimer();
        });
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            this.projects = await response.json();
            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    renderProjects() {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        this.projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project';
        div.innerHTML = `
            <div class="project-header">
                <div class="project-title">${project.title}</div>
                <button class="btn-secondary" onclick="app.exportProject('${project._id}')">Export JSON</button>
            </div>
            <div class="project-tasks">
                ${project.tasks.map(task => this.createTaskElement(task, project._id)).join('')}
            </div>
        `;
        return div;
    }

    createTaskElement(task, projectId) {
        return `
            <div class="task ${task.completed ? 'completed' : ''}" data-task-id="${task._id}">
                <div class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="app.toggleTask('${projectId}', '${task._id}')">
                    <div class="task-content">
                        <div>
                            <div class="task-title">${task.title}</div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn" onclick="app.showDetails('${task.description}')">Details</button>
                            <button class="action-btn" onclick="app.showNotesModal('task', '${projectId}', '${task._id}')">Notes</button>
                        </div>
                    </div>
                </div>
                <div class="subtasks">
                    ${task.subtasks.map(subtask => this.createSubtaskElement(subtask, projectId, task._id)).join('')}
                </div>
            </div>
        `;
    }

    createSubtaskElement(subtask, projectId, taskId) {
        return `
            <div class="subtask ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask._id}">
                <div class="checkbox-container">
                    <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                           onchange="app.toggleSubtask('${projectId}', '${taskId}', '${subtask._id}')">
                    <div class="subtask-content">
                        <div>
                            <div class="subtask-title">${subtask.title}</div>
                        </div>
                        <div class="subtask-actions">
                            <button class="action-btn" onclick="app.showDetails('${subtask.description}')">Details</button>
                            <button class="action-btn" onclick="app.showNotesModal('subtask', '${projectId}', '${taskId}', '${subtask._id}')">Notes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showProjectModal() {
        document.getElementById('project-modal').style.display = 'block';
        document.getElementById('project-title').value = '';
        document.getElementById('project-description').value = '';
    }

    hideProjectModal() {
        document.getElementById('project-modal').style.display = 'none';
    }

    async generateProject() {
        const title = document.getElementById('project-title').value.trim();
        const description = document.getElementById('project-description').value.trim();

        if (!title || !description) {
            alert('Please enter both title and description');
            return;
        }

        const generateBtn = document.getElementById('generate-tasks-btn');
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        try {
            // Create project
            const projectResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });

            const project = await projectResponse.json();

            // Generate tasks with AI
            const aiResponse = await fetch('/api/ai/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDescription: description })
            });

            const aiResult = await aiResponse.json();

            if (aiResult.error) {
                alert(aiResult.error);
                return;
            }

            // Add generated tasks to project
            for (const task of aiResult.tasks) {
                const taskResponse = await fetch(`/api/projects/${project._id}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });

                const updatedProject = await taskResponse.json();
                const addedTask = updatedProject.tasks[updatedProject.tasks.length - 1];

                // Add subtasks
                for (const subtask of task.subtasks) {
                    await fetch(`/api/projects/${project._id}/tasks/${addedTask._id}/subtasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(subtask)
                    });
                }
            }

            this.hideProjectModal();
            this.loadProjects();
        } catch (error) {
            console.error('Error generating project:', error);
            alert('Error generating project. Please try again.');
        } finally {
            generateBtn.textContent = 'Generate Tasks with AI';
            generateBtn.disabled = false;
        }
    }

    async toggleTask(projectId, taskId) {
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/toggle`, {
                method: 'PATCH'
            });
            
            const result = await response.json();
            
            // Play completion sound and animation
            this.playCompletionFeedback();
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('task-completion');
                setTimeout(() => taskElement.classList.remove('task-completion'), 600);
            }
            
            // Check if project was completed and deleted
            if (result.deleted) {
                // Show completion message with special celebration
                this.showProjectCompletionMessage(result.message);
                setTimeout(() => this.loadProjects(), 1500); // Delay to show the message
            } else {
                this.loadProjects();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }

    async toggleSubtask(projectId, taskId, subtaskId) {
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
                method: 'PATCH'
            });
            
            const result = await response.json();
            
            // Play completion sound and animation
            this.playCompletionFeedback();
            const subtaskElement = document.querySelector(`[data-subtask-id="${subtaskId}"]`);
            if (subtaskElement) {
                subtaskElement.classList.add('subtask-completion');
                setTimeout(() => subtaskElement.classList.remove('subtask-completion'), 400);
            }
            
            // Check if project was completed and deleted
            if (result.deleted) {
                // Show completion message with special celebration
                this.showProjectCompletionMessage(result.message);
                setTimeout(() => this.loadProjects(), 1500); // Delay to show the message
            } else {
                this.loadProjects();
            }
        } catch (error) {
            console.error('Error toggling subtask:', error);
        }
    }

    playCompletionFeedback() {
        try {
            this.completionSound.currentTime = 0;
            this.completionSound.play();
        } catch (error) {
            console.log('Could not play sound:', error);
        }
    }

    showNotesModal(type, projectId, taskId, subtaskId = null) {
        this.currentEditingNotes = { type, projectId, taskId, subtaskId };
        
        // Get current notes
        const project = this.projects.find(p => p._id === projectId);
        const task = project.tasks.find(t => t._id === taskId);
        let currentNotes = '';
        
        if (type === 'task') {
            currentNotes = task.notes || '';
        } else {
            const subtask = task.subtasks.find(s => s._id === subtaskId);
            currentNotes = subtask.notes || '';
        }
        
        document.getElementById('notes-text').value = currentNotes;
        document.getElementById('notes-modal').style.display = 'block';
    }

    hideNotesModal() {
        document.getElementById('notes-modal').style.display = 'none';
        this.currentEditingNotes = null;
    }

    async saveNotes() {
        if (!this.currentEditingNotes) return;

        const notes = document.getElementById('notes-text').value;
        const { type, projectId, taskId, subtaskId } = this.currentEditingNotes;

        try {
            let url = `/api/projects/${projectId}/tasks/${taskId}/notes`;
            if (type === 'subtask') {
                url = `/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}/notes`;
            }

            await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });

            this.hideNotesModal();
            this.loadProjects();
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    showDetails(description) {
        document.getElementById('details-text').textContent = description;
        document.getElementById('details-modal').style.display = 'block';
    }

    hideDetailsModal() {
        document.getElementById('details-modal').style.display = 'none';
    }

    showImportModal() {
        document.getElementById('import-modal').style.display = 'block';
        document.getElementById('import-json').value = '';
    }

    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
    }

    async importProject() {
        const jsonText = document.getElementById('import-json').value.trim();
        
        if (!jsonText) {
            alert('Please paste JSON data to import');
            return;
        }
        console.log('Importing project JSON:', jsonText);
        try {
            const projectData = JSON.parse(jsonText);
            console.log('Parsed project data:', projectData);
            const response = await fetch('/api/projects/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectData })
            });

            if (response.ok) {
                this.hideImportModal();
                this.loadProjects();
                alert('Project imported successfully!');
            } else {
                const error = await response.json();
                alert('Import failed: ' + error.error);
            }
        } catch (error) {
            console.error('Error importing project:', error);
            alert('Invalid JSON format or import failed');
        }
    }

    async exportProject(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}/export`);
            const projectData = await response.json();

            // Create downloadable file
            const dataStr = JSON.stringify(projectData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting project:', error);
            alert('Export failed');
        }
    }

    updateTimerDisplay() {
        const minutes = String(Math.floor(this.timeLeft / 60)).padStart(2, '0');
        const seconds = String(this.timeLeft % 60).padStart(2, '0');
        document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
        document.getElementById('timer-mode').textContent = this.timerMode === 'work' ? 'Focus' : 'Break';
    }

    toggleTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            document.getElementById('start-timer').textContent = 'Start';
        } else {
            document.getElementById('start-timer').textContent = 'Pause';
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.switchMode();
                }
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerMode = 'work';
        this.timeLeft = this.timerDuration;
        document.getElementById('start-timer').textContent = 'Start';
        this.updateTimerDisplay();
    }

    switchMode() {
        this.playCompletionFeedback();
        if (this.timerMode === 'work') {
            this.timerMode = 'break';
            this.timeLeft = this.breakDuration;
        } else {
            this.timerMode = 'work';
            this.timeLeft = this.timerDuration;
        }
        this.updateTimerDisplay();
    }

    showProjectCompletionMessage(message) {
        // Create a celebration overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        `;
        
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: #4caf50;
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            font-size: 1.5rem;
            font-weight: bold;
            animation: celebration 0.6s ease-in-out;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        `;
        messageBox.textContent = '🎉 ' + message + ' 🎉';
        
        overlay.appendChild(messageBox);
        document.body.appendChild(overlay);
        
        // Add celebration animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes celebration {
                0% { transform: scale(0.5) rotate(-10deg); }
                50% { transform: scale(1.1) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove overlay after delay
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        }, 1400);
        
        // Play extra completion sound for project completion
        this.playCompletionFeedback();
        setTimeout(() => this.playCompletionFeedback(), 200);
        setTimeout(() => this.playCompletionFeedback(), 400);
    }
}

// Initialize the app
const app = new WilpApp();
