import axiosClient from "@/lib/axiosClient";
import axios from "axios";

// Auth API endpoints
const AuthAPI = {
  signUpEmail: (data: {
    name: string;
    email: string;
    password: string;
    userType: "client" | "advocate";
  }) => axiosClient.post("/api/auth/sign-up/email", data),

  /**
   * Sign in using email and password
   * @param data - Object containing email and password
   * @returns Promise resolving to the sign-in response
   */
  signInEmail: (data: { email: string; password: string }) =>
    axiosClient.post("/api/auth/sign-in/email", data),

  /**
   * Update user profile
   * @param data - Object containing profile fields
   * @returns Promise resolving to the update response
   */
  updateUser: (data: {
    name?: string;
    image?: string;
    district?: string;
    state?: string;
    location?: string;
  }) => axiosClient.post("/api/auth/update-user", data),

  /**
   * Get current user profile
   * @returns Promise resolving to the user profile
   */
  getProfile: () => axiosClient.get("/api/auth/profile"),
  // Add more auth endpoints here as needed
};

// Advocate API endpoints
const AdvocateAPI = {
  /**
   * Register as an advocate
   * @param data - Object containing registration details
   * @returns Promise resolving to the registration response
   */
  register: (data: {
    registration_number: string;
    reference_number: string;
    verification_document_url: string;
  }) => axiosClient.post("/api/advocate/register", data),

  /**
   * Get advocate's own data
   * @returns Promise resolving to the advocate data
   */
  getAdvocateData: () => axiosClient.get("/api/advocate/me"),

  /**
   * Update advocate information
   * @param data - Object containing advocate profile fields
   * @returns Promise resolving to the update response
   */
  updateAdvocateInfo: (data: {
    name?: string;
    contact_email?: string;
    phone_number?: string;
    qualification?: string;
    experience_years?: string; // Changed from number to string (Junior, Mid-level, Senior, etc.)
    profile_photo_url?: string;
    availability_status?: boolean;
    language_preferences?: string[];
    location_city?: string;
    jurisdiction_states?: string[];
    fee_structure?: {
      Consultation?: number;
      PreAppearance?: number;
      FixedCase?: number;
    };
  }) => axiosClient.put("/api/advocate/update", data),

  /**
   * Add a specialization to a verified advocate's profile
   * @param data - Object containing the specialization
   * @returns Promise resolving to the response
   */
  addSpecialization: (data: { specialization: string }) =>
    axiosClient.post("/api/advocate/add-specialization", data),

  /**
   * Get all specializations of the verified advocate
   * @returns Promise resolving to the specializations
   */
  getSpecializations: () => axiosClient.get("/api/advocate/specializations"),

  /**
   * Search verified advocates based on multiple filters
   * @param filters - Object containing search filters
   * @returns Promise resolving to the list of advocates
   */
  searchAdvocates: (filters: {
    location_city?: string;
    jurisdiction_states?: string[];
    specialization?: string;
    availability_status?: boolean;
    language_preferences?: string[];
    experience_level?: "Junior" | "MidLevel" | "Senior";
    fee_type?: "Consultation" | "PreAppearance" | "FixedCase";
    max_fee?: number;
    min_rating?: number;
    sort_by?: "rating" | "experience";
    sort_order?: "asc" | "desc";
  }) => axiosClient.post("/api/search/advocate", filters),

  /**
   * Get advocate details by ID
   * @param advocateId - The ID of the advocate
   * @returns Promise resolving to the advocate details
   */
  getAdvocateById: (advocateId: string) =>
    axiosClient.get(`/api/get-advocate/${advocateId}`),

  /**

   * Get ratings for an advocate
   * @param advocateId - The ID of the advocate
   * @returns Promise resolving to the ratings data
   */
  getAdvocateRatings: (advocateId: string) =>
    axiosClient.get(`/api/get-rating/${advocateId}`),

  /**
   * Add a rating and feedback for an advocate
   * @param advocateId - The ID of the advocate to rate
   * @param data - Object containing stars and optional feedback
   * @returns Promise resolving to the rating response
   */
  addRating: (advocateId: string, data: { stars: number; feedback?: string }) =>
    axiosClient.post(`/api/add-rating/${advocateId}`, data),

  /**
   * Report an advocate for a violation
   * @param data - Object containing report details
   * @returns Promise resolving to the report response
   */
  reportAdvocate: (data: {
    advocate_id: string;
    reason: string;
    details: string;
    category: string;
  }) => axiosClient.post("/api/advocate/report", data),

  /**
   * Add a new legal case handled by the advocate
   * @param data - Case details
   * @returns Promise resolving to the response
   */
  addCase: (data: {
    case_type: string;
    role: string;
    year: number;
    outcome: string;
    description?: string;
    court_name?: string;
    duration_months?: number;
  }) => axiosClient.post("/api/advocate/add-case", data),

  /**
   * Get all cases for a specific advocate
   * @param advocateId - The ID of the advocate
   * @returns Promise resolving to the list of cases
   */
  getCases: (advocateId: string) =>
    axiosClient.get(`/api/advocate/cases/${advocateId}`),

  /**
   * Update an existing legal case (must belong to authenticated advocate)
   * @param caseId - The ID of the case to update
   * @param data - Updated case details
   * @returns Promise resolving to the response
   */
  updateCase: (
    caseId: string,
    data: {
      case_type: string;
      role: string;
      year: number;
      outcome: string;
      description?: string;
      court_name?: string;
      duration_months?: number;
    }
  ) => axiosClient.patch(`/api/advocate/update-case/${caseId}`, data),

  /**
   * Delete a case by ID (must belong to authenticated advocate)
   * @param caseId - The ID of the case to delete
   * @returns Promise resolving to the response
   */
  deleteCase: (caseId: string) =>
    axiosClient.delete("/api/advocate/case", { data: { case_id: caseId } }),

  /**
   * Get a specific case by ID
   * @param caseId - The ID of the case to fetch
   * @returns Promise resolving to the case details
   */
  getCaseById: (caseId: string) =>
    axiosClient.get(`/api/advocate/case/${caseId}`),

  // Add more advocate endpoints here as needed
};

// Upload API endpoints
const UploadAPI = {
  /**
   * Upload a file (image or PDF) to the backend
   * @param file - File object to upload
   * @returns Promise resolving to the upload response (with url)
   */
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Social/Post API endpoints
const SocialAPI = {
  /**
   * Create a new post as an advocate
   * @param data - Object containing text and optional image_url
   * @returns Promise resolving to the created post
   */
  createPost: (data: { text: string; image_url?: string,category:string }) =>
    axiosClient.post("/api/social/post/create", data),

  /**
   * Get all advocate posts
   * @returns Promise resolving to the list of posts
   */
  getAllPosts: () => axiosClient.get("/api/social/post/all"),

  /**
   * Get all posts by the logged-in advocate
   * @returns Promise resolving to the list of posts
   */
  getMyPosts: (advocate_id: string) =>
    axiosClient.get(`/api/social/post/${advocate_id}`),

  /**
   * Edit a post by the logged-in advocate
   * @param data - Object containing post_id, text, and optional image_url
   * @returns Promise resolving to the updated post
   */
  editPost: (data: { post_id: string; text: string; image_url?: string }) =>
    axiosClient.post("/api/social/post/edit", data),

  /**
   * Delete a post by the logged-in advocate
   * @param post_id - The ID of the post to delete
   * @returns Promise resolving to the delete response
   */
  deletePost: (post_id: string) =>
    axiosClient.delete(`/api/social/post/${post_id}`),

  /**
   * Get all posts by a specific advocate
   * @param advocateId - The ID of the advocate
   * @returns Promise resolving to the list of posts
   */
  getPostsByAdvocate: (advocateId: string) =>
    axiosClient.get(`/api/social/post/advocate/${advocateId}`),

  /**
   * React to a post (like, love, etc.)
   * @param data - Object containing post_id and type
   * @returns Promise resolving to the reaction
   */
  reactToPost: (data: { post_id: string; type: string }) =>
    axiosClient.post("/api/social/post/react", data),

  /**
   * Comment on a post
   * @param data - Object containing post_id and comment
   * @returns Promise resolving to the comment response
   */
  commentOnPost: (data: { post_id: string; comment: string }) =>
    axiosClient.post("/api/social/post/comment", data),

  /**
   * Get all comments for a post
   * @param post_id - The ID of the post
   * @returns Promise resolving to the list of comments
   */
  getComments: (post_id: string) =>
    axiosClient.get(`/api/social/post/${post_id}/comments`),

  /**
   * Get the current user's reaction to a post
   * @param post_id - The ID of the post
   * @returns Promise resolving to the user's reaction type
   */
  getMyReaction: (post_id: string) =>
    axiosClient.get(`/api/social/post/${post_id}/my-reaction`),

  /**
   * Get the count of each reaction type for a post
   * @param post_id - The ID of the post
   * @returns Promise resolving to an object with reaction counts
   */
  getReactionsCountByType: (post_id: string) =>
    axiosClient.get(`/api/social/post/${post_id}/reactions`),

  /**
   * Get a single post by ID
   * @param post_id - The ID of the post
   * @returns Promise resolving to the post details
   */
  getPostById: (post_id: string) =>
    axiosClient.get(`/api/social/post/get/${post_id}`),

  /**
   * Check if the current user has reacted to a post
   * @param post_id - The ID of the post
   * @returns Promise resolving to an object indicating reaction status
   */
  getIsReacted: (post_id: string) =>
    axiosClient.get(`/api/social/post/${post_id}/is_reacted`),
};

// Appointment API endpoints
const AppointmentAPI = {
  getAdvocateConnection: () => {
    return axiosClient.get("/api/appointment/advocate/calendar/connect");
  },

  // Get all appointments from advocate's calendar
  getAdvocateCalendarAppointments: () =>
    axiosClient.get("/api/appointment/advocate/calendar"),

  // Get available slots for an advocate (public)
  getAdvocateAvailability: (advocateId: string) =>
    axiosClient.get(`/api/appointment/advocate/availability/${advocateId}`),

  // Book an appointment (user only)
  book: (data: {
    advocate_id: string;
    startTime: string;
    endTime: string;
    reason: string;
    notes?: string;
  }) => axiosClient.post("/api/appointment/book", data),

  // Cancel an appointment (user or advocate)
  cancel: (appointment_id: string) =>
    axiosClient.post("/api/appointment/cancel", { appointment_id }),

  // Confirm an appointment (advocate only)
  confirm: (appointment_id: string) =>
    axiosClient.post("/api/appointment/advocate/confirm", { appointment_id }),

  // Get all appointments for the logged-in user
  getUserAppointments: () =>
    axiosClient.get("/api/appointment/user/appointments"),

  // Get all appointments for the logged-in advocate
  getAdvocateAppointments: () =>
    axiosClient.get("/api/appointment/advocate/calendar"),

  // Get a specific appointment by ID
  getAppointmentById: (appointment_id: string) =>
    axiosClient.get(`/api/appointment/details/${appointment_id}`),

  // Add advocate availability slots (advocate only)
  addAvailabilitySlot: (data: {
    date: string;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
    daysOfWeek?: number[];
  }) => axiosClient.post("/api/appointment/advocate/add-slot", data),

  // Mark an appointment as completed (advocate only)
  markAsCompleted: (appointment_id: string) =>
    axiosClient.post("/api/appointment/advocate/complete", { appointment_id }),

  // Reschedule an appointment (requires both parties to confirm)
  requestReschedule: (data: {
    appointment_id: string;
    new_start_time: string;
    new_end_time: string;
    reason?: string;
  }) => axiosClient.post("/api/appointment/reschedule-request", data),

  // Confirm a reschedule request
  confirmReschedule: (reschedule_request_id: string) =>
    axiosClient.post("/api/appointment/confirm-reschedule", {
      reschedule_request_id,
    }),
};

// AI API endpoints  
const AiAPI = {
  /**
   * Send a chat message to AI service
   * @param data - Object containing message and context
   * @returns Promise resolving to AI response
   */
  sendMessage: (data: {
    message: string;
    userId?: string;
    context?: any;
  }) => {
    const aiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
      timeout: 30000, // 30 second timeout for AI responses
    });
    return aiClient.post('/api/v1/chat', data);
  },

  /**
   * Get AI service health status
   * @returns Promise resolving to health status
   */
  getHealthStatus: () => {
    const aiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
    });
    return aiClient.get('/health');
  },

  /**
   * Get available AI services
   * @returns Promise resolving to service list
   */
  getServices: () => {
    const aiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
    });
    return aiClient.get('/api/v1/services');
  },
};

// Export all API groups here
export const API = {
  Auth: AuthAPI,
  Advocate: AdvocateAPI,
  Upload: UploadAPI,
  Social: SocialAPI,
  Appointment: AppointmentAPI,
  AI: AiAPI,
  // Add more groups (e.g., User, Post) as needed
};
