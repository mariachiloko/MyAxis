export default {
  defaultWorkspace: "work",
  aiEndpoint: "",
  apiBaseUrl: "",
  apiAccessToken: "",
  workspaces: [
    {
      id: "work",
      label: "Work",
      eyebrow: "",
      title: "",
      description: "",
      accent: "#7dd3fc",
      accent2: "#a78bfa",
      stats: [],
      schedule: [],
      kanban: [
        { id: "todo", title: "To-do", cards: [] },
        { id: "in-progress", title: "In progress", cards: [] },
        { id: "done", title: "Done", cards: [] }
      ],
      calendar: [],
      spotlight: {
        type: "flashcards",
        title: "",
        cards: []
      },
      goals: [],
      quote: "",
      captureHint: "",
      scratchpadKey: "dashboard-scratchpad-work"
    },
    {
      id: "projects",
      label: "Projects",
      eyebrow: "",
      title: "",
      description: "",
      accent: "#34d399",
      accent2: "#7dd3fc",
      stats: [],
      schedule: [],
      kanban: [
        { id: "todo", title: "To-do", cards: [] },
        { id: "in-progress", title: "In progress", cards: [] },
        { id: "done", title: "Done", cards: [] }
      ],
      calendar: [],
      spotlight: {
        type: "flashcards",
        title: "",
        cards: []
      },
      goals: [],
      quote: "",
      captureHint: "",
      scratchpadKey: "dashboard-scratchpad-projects"
    },
    {
      id: "study",
      label: "Study",
      eyebrow: "",
      title: "",
      description: "",
      accent: "#f59e0b",
      accent2: "#fb7185",
      stats: [],
      schedule: [],
      kanban: [
        { id: "todo", title: "To-do", cards: [] },
        { id: "in-progress", title: "In progress", cards: [] },
        { id: "done", title: "Done", cards: [] }
      ],
      calendar: [],
      spotlight: {
        type: "flashcards",
        title: "",
        cards: []
      },
      goals: [],
      quote: "",
      captureHint: "",
      scratchpadKey: "dashboard-scratchpad-study"
    },
    {
      id: "home",
      label: "Home",
      eyebrow: "",
      title: "",
      description: "",
      accent: "#f472b6",
      accent2: "#f59e0b",
      stats: [],
      schedule: [],
      todos: [],
      groceries: [],
      menuByDay: {
        Mon: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Tue: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Wed: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Thu: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Fri: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Sat: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ],
        Sun: [
          { meal: "Breakfast", title: "", detail: "" },
          { meal: "Lunch", title: "", detail: "" },
          { meal: "Dinner", title: "", detail: "" }
        ]
      },
      calendar: [],
      spotlight: {
        type: "quote",
        title: "",
        body: ""
      },
      goals: [],
      quote: "",
      captureHint: "",
      scratchpadKey: "dashboard-scratchpad-home"
    }
  ]
};
