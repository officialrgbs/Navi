import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://lokmeumlcoditugsxazm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxva21ldW1sY29kaXR1Z3N4YXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NzgzODgsImV4cCI6MjA2NzQ1NDM4OH0.TnScfjkmXwFfi4B0Iqi1PMtSOIz8X5kF9PFjq2jaOVE';

const supabase = createClient(supabaseUrl, supabaseKey);

const subjectStyles = {
    "Values":            { bg: "#ffe5ec", label: "Values" },                // pastel pink
    "Mathematics":       { bg: "#d0f4de", label: "Math" },                  // pastel green
    "Filipino":          { bg: "#fff3cd", label: "Filipino" },              // pastel yellow
    "Research 2":        { bg: "#e0c3fc", label: "Research 2" },            // pastel purple
    "Electronics and Robotics": { bg: "#b5ead7", label: "Electronics & Robotics" }, // pastel teal
    "Science":           { bg: "#f3ffe3", label: "Science" },               // pastel light green
    "English":           { bg: "#cce2f7", label: "English" },               // pastel blue
    "Analytic Geometry": { bg: "#f7d6e0", label: "Analytic Geometry" },     // pastel rose
    "Music":             { bg: "#f9e2ae", label: "Music" },                 // pastel peach
    "Arts":              { bg: "#e2f0cb", label: "Arts" },                  // pastel mint
    "Physical Education":{ bg: "#d4e2d4", label: "Physical Education" },    // pastel sage
    "Health":            { bg: "#ffe0ac", label: "Health" },                // pastel apricot
    "Araling Panlipunan":{ bg: "#f6dfeb", label: "Araling Panlipunan" }     // pastel lavender
};

const processSubject = (subject) => {
    const style = subjectStyles[subject];
    if (style) {
        return `<span style="background:${style.bg};padding:2px 8px;border-radius:8px;">${style.label}</span>`;
    } else {
        return `<span style="background:#e0e0e0;padding:2px 8px;border-radius:8px;">${subject}</span>`;
    }
};

const processDeadline = (deadline) => {
    if (deadline === null) {
        return "<i>No deadline</i>";
    } 
    const deadlineDate = new Date(deadline);

    const formattedDate = deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    deadlineDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate.getTime() === tomorrow.getTime()) {
        return "<span class='text-red-500'>TOMORROW!</span>";
    } else if (deadlineDate.getTime() === today.getTime()) {
        return "<span class='text-green-500'>TODAY!</span>";
    } else if (deadlineDate.getTime() < today.getTime()) {
        return "<span class='text-blue-500'>PAST!</span>";
    }
    else {
        return formattedDate;
    }
}

const deleteAssignment = async (assignment_title) => {

    const { data, error } = await supabase
        .from('Assignments')
        .delete()
        .eq('assignment_title', assignment_title);

    if (error) {
        console.error('Error deleting assignment:', error.message);
    }
    else {
        console.log('Assignment deleted successfully:', data);
        getData();
    }
}

const getData = async () => {
    const { data, error } = await supabase
        .from('Assignments')
        .select('assignment_title, time_created, Subject, deadline'); 

    const output = document.getElementById('output');
    output.innerHTML = '';

    if (error) {
        console.error('Error fetching data:', error.message);
        output.innerHTML = `Failed to fetch data`;
        return;
    }

    if (data.length === 0) {
        output.innerHTML = 'No assignments found';
        return;
    }

    data.sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline) : Infinity;
        const dateB = b.deadline ? new Date(b.deadline) : Infinity;
        return dateA - dateB;
    });

    data.forEach(({ assignment_title, deadline, Subject }) => {
        const assignmentDiv = document.createElement('div');
        assignmentDiv.className = 'bg-white rounded-xl p-4 mb-4 shadow hover:shadow-lg transition';
        assignmentDiv.style.backgroundColor = "#f5deb3";
       
        
        const isTomorrow = (() => {
            if (!deadline) return false;
            const deadlineDate = new Date(deadline);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            return deadlineDate.toDateString() === tomorrow.toDateString();
        })();
        
        const titleDisplay = isTomorrow ? `‼️ ${assignment_title}` : assignment_title;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex justify-between items-center flex-wrap gap-2';

        const infoSpan = document.createElement('span');
        infoSpan.innerHTML = `${titleDisplay} - ${processDeadline(deadline)} <br> ${processSubject(Subject)}`;
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded-md ml-2';
        deleteButton.innerHTML = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteAssignment(assignment_title);
        });
        
        contentDiv.appendChild(infoSpan);
        contentDiv.appendChild(deleteButton);

        assignmentDiv.appendChild(contentDiv);
        
        output.appendChild(assignmentDiv);
    });
};

getData();

const modalOverlay = document.getElementById('modalOverlay');

const openModal = () => {
    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
}

const closeModal = () => {
    modalOverlay.classList.remove('flex');
    modalOverlay.classList.add('hidden');
}

const modalForm = document.getElementById('modalForm');

modalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(modalForm);
    const assignmentTitle = formData.get('assignment_title');
    const deadline = formData.get('deadline');
    const subject = formData.get('Subject');

    insertAssignment(assignmentTitle, deadline, subject);
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

const insertAssignment = async (assignmentTitle, deadline, subject) => {

    const parsedDeadline = deadline === "" ? null : deadline;

    const { data, error } = await supabase
        .from('Assignments')
        .insert({
            assignment_title: assignmentTitle,
            deadline: parsedDeadline,
            Subject: subject
        });
        
    if (error) {
        console.error('Error inserting assignment:', error.message);
        alert('Error adding assignment: ' + error.message);
    } else {
        console.log('Assignment inserted successfully:', data);
        getData();
        closeModal();
    }
}

const insert = document.getElementById('insert');
insert.addEventListener('click', openModal);

const closeModalBtn = document.getElementById('closeModal');
closeModalBtn.addEventListener('click', closeModal);
