import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const Booking = () => {
  const [services, setServices] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [mode, setMode] = useState("browse");
  const [activeTab, setActiveTab] = useState("services"); // Default to services
  const [serviceSlideIndex, setServiceSlideIndex] = useState(0);
  const [membershipSlideIndex, setMembershipSlideIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientAddress: "",
    serviceId: "",
    membershipId: "",
    itemType: "",
    dateFrom: new Date().toISOString().slice(0, 10),
    timeFrom: "",
    notes: "",
  });

  useEffect(() => {
    fetchServices();
    fetchMemberships();
  }, []);

  useEffect(() => {
    if (mode === "book" && formData.itemType && formData.dateFrom && selectedService) {
      checkAvailability();
    }
  }, [mode, formData.itemType, formData.dateFrom, selectedService]);

  const fetchServices = async () => {
    try {
      const response = await api.get("/services");
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchMemberships = async () => {
    try {
      const response = await api.get("/memberships");
      setMemberships(response.data);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    }
  };

  const checkAvailability = async () => {
    if (!formData.dateFrom || !selectedService) return;

    setChecking(true);
    try {
      const duration = selectedService.durationMinutes || 60;
      const response = await api.get("/bookings/available-times", {
        params: {
          date: formData.dateFrom,
          duration: duration,
        },
      });
      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error("Error checking availability:", error);
      toast.error("Failed to check availability");
    } finally {
      setChecking(false);
    }
  };

  const handleServiceSelect = (service, type) => {
    setSelectedService(service);
    setFormData({
      ...formData,
      serviceId: type === "service" ? (service._id || service.id) : "",
      membershipId: type === "membership" ? (service._id || service.id) : "",
      itemType: type,
    });
  };

  const handleTimeSlotSelect = (timeFrom) => {
    setFormData({ ...formData, timeFrom });
  };

  const handleBookClick = (service, type) => {
    handleServiceSelect(service, type);
    setMode("book");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInquiryClick = (service, type) => {
    handleServiceSelect(service, type);
    setMode("inquiry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "book" && !formData.timeFrom) {
      toast.error("Please select a time slot");
      return;
    }

    setLoading(true);
    try {
      if (mode === "book") {
        const response = await api.post("/bookings", formData);
        toast.success("Booking request submitted successfully! We'll confirm soon.");
      } else {
        toast.success(
          `Thank you for your inquiry about ${selectedService?.title || selectedService?.name}! We'll contact you soon.`
        );
      }

      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        clientAddress: "",
        serviceId: "",
        membershipId: "",
        itemType: "",
        dateFrom: new Date().toISOString().slice(0, 10),
        timeFrom: "",
        notes: "",
      });
      setSelectedService(null);
      setAvailableSlots([]);
      setMode("browse");
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to submit request";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get enhanced description based on service type
  const getServiceDescription = (service) => {
    const title = service.title?.toLowerCase() || "";
    const desc = service.description || "";
    
    if (title.includes("dry") || title.includes("steam")) {
      return desc || "Experience the ultimate detoxification with our dry and steam therapy. Perfect for cleansing, relaxation, and rejuvenation of body and mind.";
    }
    if (title.includes("aroma") || title.includes("oil")) {
      return desc || "Indulge in luxurious aromatherapy with essential oils that soothe muscles, reduce stress, and promote deep relaxation and healing.";
    }
    if (title.includes("ayurveda")) {
      return desc || "Traditional Ayurvedic oil therapy using authentic herbs and oils for holistic healing, balance, and rejuvenation.";
    }
    if (title.includes("hamam") || title.includes("turkish")) {
      return desc || "Experience authentic Turkish Hamam - a centuries-old ritual of cleansing, exfoliation, and relaxation in a luxurious setting.";
    }
    if (title.includes("jacuzzi")) {
      return desc || "Rejuvenate in our premium jacuzzi therapy with hydrotherapy jets, perfect for relaxation and muscle relief.";
    }
    if (title.includes("couple")) {
      return desc || "Special romantic spa experience for couples, creating lasting memories in a serene and intimate environment.";
    }
    if (title.includes("head") || title.includes("foot")) {
      return desc || "Targeted therapy for head and foot, relieving tension, improving circulation, and promoting relaxation.";
    }
    if (title.includes("scrub") || title.includes("cream")) {
      return desc || "Deep exfoliation and moisturizing treatment that leaves your skin soft, smooth, and glowing with natural radiance.";
    }
    if (title.includes("massage")) {
      return desc || "Professional massage therapy designed to relieve tension, reduce pain, and restore your body's natural balance.";
    }
    return desc || "Premium spa service designed for ultimate relaxation, wellness, and rejuvenation.";
  };

  // Helper function to get service benefits
  const getServiceBenefits = (service) => {
    const title = service.title?.toLowerCase() || "";
    if (title.includes("dry") || title.includes("steam")) {
      return ["Deep Detoxification", "Improved Circulation", "Stress Relief", "Skin Purification"];
    }
    if (title.includes("aroma") || title.includes("oil")) {
      return ["Muscle Relaxation", "Stress Reduction", "Improved Sleep", "Enhanced Mood"];
    }
    if (title.includes("ayurveda")) {
      return ["Holistic Healing", "Energy Balance", "Skin Rejuvenation", "Overall Wellness"];
    }
    if (title.includes("hamam")) {
      return ["Deep Cleansing", "Skin Exfoliation", "Relaxation", "Cultural Experience"];
    }
    if (title.includes("jacuzzi")) {
      return ["Hydrotherapy", "Muscle Relief", "Stress Reduction", "Improved Circulation"];
    }
    if (title.includes("couple")) {
      return ["Romantic Experience", "Quality Time", "Shared Relaxation", "Memory Creation"];
    }
    return ["Relaxation", "Wellness", "Rejuvenation", "Stress Relief"];
  };

  const defaultImage = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop";

  // Slider navigation functions
  const getItemsPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 576) return 1; // Mobile
      if (window.innerWidth < 768) return 1; // Small tablets
      if (window.innerWidth < 992) return 2; // Tablets
      if (window.innerWidth < 1200) return 3; // Desktop
      return 4; // Large desktop
    }
    return 1;
  };

  const nextSlide = (type) => {
    const itemsPerSlide = getItemsPerSlide();
    if (type === "services") {
      const maxIndex = Math.max(0, services.length - itemsPerSlide);
      setServiceSlideIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    } else {
      const maxIndex = Math.max(0, memberships.length - itemsPerSlide);
      setMembershipSlideIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }
  };

  const prevSlide = (type) => {
    const itemsPerSlide = getItemsPerSlide();
    if (type === "services") {
      const maxIndex = Math.max(0, services.length - itemsPerSlide);
      setServiceSlideIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    } else {
      const maxIndex = Math.max(0, memberships.length - itemsPerSlide);
      setMembershipSlideIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (type) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide(type);
    }
    if (isRightSwipe) {
      prevSlide(type);
    }
  };

  if (mode === "browse") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", paddingBottom: "80px" }}>
        {/* Hero Header */}
        <div
          className="text-center py-5 text-white position-relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            position: "relative",
          }}
        >
          <div className="container position-relative" style={{ zIndex: 2 }}>
              <img
              src="/logo.png"
              alt="logo"
              className="mb-3"
              style={{ width: "clamp(100px, 25vw, 160px)", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
            />
            <h1 className="mb-2" style={{ fontFamily: "Poppins", fontWeight: "700", fontSize: "clamp(1.8rem, 6vw, 3.5rem)", textShadow: "2px 2px 4px rgba(0,0,0,0.2)", padding: "0 15px" }}>
              Cindrella The Family Spa
            </h1>
            <p className="mb-2" style={{ opacity: 0.95, fontWeight: "300", fontSize: "clamp(1.1rem, 3vw, 1.8rem)", padding: "0 15px" }}>
              Relax, Rejuvenate, Repeat
            </p>
            <p className="mt-3 mb-0" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)", opacity: 0.9, padding: "0 15px" }}>
              Experience luxury wellness and premium spa treatments in a serene environment
            </p>
          </div>
        </div>

        <div className="container py-4 py-md-5">
          {/* Services Section */}
          {activeTab === "services" && (
            <div className="mb-5">
              <div className="text-center mb-4 mb-md-5">
                <h2 className="mb-2 mb-md-3" style={{ fontFamily: "Poppins", fontWeight: "700", color: "#1b5e20", fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
                  Our Premium Services
                </h2>
                <p className="text-muted" style={{ maxWidth: "700px", margin: "0 auto", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", padding: "0 15px" }}>
                  Indulge in our comprehensive range of therapeutic treatments designed to restore your body, mind, and soul
                </p>
              </div>

              {/* Services Slider */}
              <div 
                className="position-relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd("services")}
                style={{ padding: "0 10px" }}
              >
                <div style={{ overflow: "hidden", position: "relative", borderRadius: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      transform: `translateX(-${serviceSlideIndex * (100 / getItemsPerSlide())}%)`,
                      transition: "transform 0.5s ease-in-out",
                      gap: "1rem",
                    }}
                  >
                    {services.map((service, idx) => {
                      const description = getServiceDescription(service);
                      const benefits = getServiceBenefits(service);
                      return (
                        <div
                          key={service._id || service.id}
                          style={{
                            minWidth: `${100 / getItemsPerSlide()}%`,
                            padding: "0 8px",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            className="card h-100 shadow-sm border-0"
                            style={{
                              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                              borderRadius: "20px",
                              overflow: "hidden",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                              e.currentTarget.style.boxShadow = "0 20px 40px rgba(27,94,32,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0) scale(1)";
                              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                            }}
                          >
                            <div
                              style={{
                                height: "clamp(200px, 35vw, 280px)",
                                overflow: "hidden",
                                position: "relative",
                                backgroundColor: "#e8f5e9",
                              }}
                            >
                              <img
                                src={service.image || defaultImage}
                                alt={service.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  transition: "transform 0.5s ease",
                                }}
                                onError={(e) => {
                                  e.target.src = defaultImage;
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = "scale(1.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = "scale(1)";
                                }}
                              />
                              <div
                                className="position-absolute top-0 end-0 m-2 m-md-3"
                                style={{
                                  background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))",
                                  borderRadius: "20px",
                                  padding: "6px 12px",
                                  fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
                                  fontWeight: "700",
                                  color: "#1b5e20",
                                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                                }}
                              >
                                ⏱️ {service.durationMinutes || 60} min
                              </div>
                              <div
                                className="position-absolute bottom-0 start-0 end-0"
                                style={{
                                  background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                  padding: "30px 15px 15px",
                                }}
                              >
                                <h5
                                  className="text-white mb-0"
                                  style={{
                                    fontFamily: "Poppins",
                                    fontWeight: "700",
                                    fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                                  }}
                                >
                                  {service.title}
                                </h5>
                              </div>
                            </div>
                            <div className="card-body d-flex flex-column p-3 p-md-4" style={{ backgroundColor: "#fff" }}>
                              <p className="text-muted mb-2 mb-md-3" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)", lineHeight: "1.7", minHeight: "40px" }}>
                                {description}
                              </p>
                            
                              {/* Benefits */}
                              <div className="mb-2 mb-md-3">
                                <small className="text-muted fw-semibold d-block mb-2" style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.85rem)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  Benefits
                                </small>
                                <div className="d-flex flex-wrap gap-1 gap-md-2">
                                  {benefits.slice(0, 4).map((benefit, bidx) => (
                                    <span
                                      key={bidx}
                                      className="badge"
                                      style={{
                                        backgroundColor: "#e8f5e9",
                                        color: "#1b5e20",
                                        padding: "4px 10px",
                                        borderRadius: "15px",
                                        fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)",
                                        fontWeight: "600",
                                      }}
                                    >
                                      ✓ {benefit}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-auto">
                                <div className="d-flex justify-content-between align-items-center mb-2 mb-md-3">
                                  <div>
                                    <span className="text-muted small" style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.85rem)" }}>Starting from</span>
                                    <div className="fw-bold text-success" style={{ fontFamily: "Poppins", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                                      ₹{service.price}
                                    </div>
                                  </div>
                                </div>
                                <div className="d-grid gap-2">
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleBookClick(service, "service")}
                                    style={{
                                      borderRadius: "12px",
                                      padding: "10px",
                                      fontWeight: "600",
                                      fontSize: "clamp(0.85rem, 2vw, 1rem)",
                                      transition: "all 0.3s ease",
                                      border: "none",
                                      background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.05)";
                                      e.target.style.boxShadow = "0 8px 20px rgba(27,94,32,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)";
                                      e.target.style.boxShadow = "none";
                                    }}
                                  >
                                    🎯 Book Appointment
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleInquiryClick(service, "service")}
                                    style={{
                                      borderRadius: "12px",
                                      padding: "8px",
                                      fontWeight: "500",
                                      borderWidth: "2px",
                                      fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
                                    }}
                                  >
                                    💬 Make Inquiry
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {services.length > getItemsPerSlide() && (
                  <>
                    <button
                      onClick={() => prevSlide("services")}
                      className="btn"
                      style={{
                        position: "absolute",
                        left: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "2px solid #1b5e20",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#1b5e20";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(255,255,255,0.95)";
                        e.target.style.color = "#1b5e20";
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => nextSlide("services")}
                      className="btn"
                      style={{
                        position: "absolute",
                        right: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "2px solid #1b5e20",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#1b5e20";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(255,255,255,0.95)";
                        e.target.style.color = "#1b5e20";
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Benefits Section for Services */}
          {activeTab === "services" && (
            <div className="mb-5 py-4 py-md-5 bg-white rounded-4 shadow-sm" style={{ margin: "0 10px" }}>
              <div className="text-center mb-4">
                <h2 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: "700", color: "#1b5e20", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                  ✨ Service Benefits
                </h2>
                <p className="text-muted" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", padding: "0 15px" }}>
                  Discover the amazing benefits our services offer
                </p>
              </div>
              <div className="row g-3 g-md-4" style={{ padding: "0 15px" }}>
                {[
                  { icon: "🧘", title: "Stress Relief", desc: "Reduce anxiety and mental tension" },
                  { icon: "💆", title: "Muscle Relaxation", desc: "Ease muscle stiffness and pain" },
                  { icon: "✨", title: "Skin Rejuvenation", desc: "Improve skin texture and glow" },
                  { icon: "🌿", title: "Detoxification", desc: "Remove toxins from your body" },
                  { icon: "💚", title: "Better Sleep", desc: "Promote restful and deep sleep" },
                  { icon: "🔥", title: "Improved Circulation", desc: "Enhance blood flow and energy" },
                ].map((benefit, idx) => (
                  <div key={idx} className="col-6 col-md-4">
                    <div className="text-center p-3 p-md-4 h-100" style={{ borderRadius: "15px", backgroundColor: "#f8f9fa" }}>
                      <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "10px" }}>{benefit.icon}</div>
                      <h6 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "#1b5e20" }}>{benefit.title}</h6>
                      <p className="text-muted small mb-0" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Memberships Section */}
          {activeTab === "memberships" && (
            <div className="mb-5">
              <div className="text-center mb-4 mb-md-5">
                <h2 className="mb-2 mb-md-3" style={{ fontFamily: "Poppins", fontWeight: "700", color: "#1b5e20", fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
                  Exclusive Membership Plans
                </h2>
                <p className="text-muted" style={{ maxWidth: "700px", margin: "0 auto", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", padding: "0 15px" }}>
                  Choose from our premium membership packages and enjoy regular spa treatments at exclusive rates
                </p>
              </div>

              {/* Memberships Slider */}
              <div 
                className="position-relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd("memberships")}
                style={{ padding: "0 10px" }}
              >
                <div style={{ overflow: "hidden", position: "relative", borderRadius: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      transform: `translateX(-${membershipSlideIndex * (100 / getItemsPerSlide())}%)`,
                      transition: "transform 0.5s ease-in-out",
                      gap: "1rem",
                    }}
                  >
                    {memberships.map((membership, idx) => {
                      const tierColors = [
                        { bg: "linear-gradient(135deg, #e3f2fd, #bbdefb)", border: "#2196f3", badge: "#1976d2" },
                        { bg: "linear-gradient(135deg, #fff3e0, #ffe0b2)", border: "#ff9800", badge: "#f57c00" },
                        { bg: "linear-gradient(135deg, #f3e5f5, #e1bee7)", border: "#9c27b0", badge: "#7b1fa2" },
                        { bg: "linear-gradient(135deg, #e8f5e9, #c8e6c9)", border: "#4caf50", badge: "#388e3c" },
                        { bg: "linear-gradient(135deg, #fffde7, #fff9c4)", border: "#fbc02d", badge: "#f9a825" },
                      ];
                      const colors = tierColors[idx % tierColors.length];
                      return (
                        <div
                          key={membership._id || membership.id}
                          style={{
                            minWidth: `${100 / getItemsPerSlide()}%`,
                            padding: "0 8px",
                            flexShrink: 0,
                          }}
                        >
                    <div
                      className="card h-100 shadow-lg border-0 position-relative"
                      style={{
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        borderRadius: "25px",
                        overflow: "hidden",
                        border: `3px solid ${colors.border}`,
                        background: colors.bg,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-15px) scale(1.05)";
                        e.currentTarget.style.boxShadow = `0 25px 50px ${colors.border}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
                      }}
                    >
                      {/* Popular Badge */}
                          <div
                            style={{
                              height: "clamp(180px, 30vw, 200px)",
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <img
                              src={membership.image || defaultImage}
                              alt={membership.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.5s ease",
                              }}
                              onError={(e) => {
                                e.target.src = defaultImage;
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                              }}
                            />
                            <div
                              className="position-absolute bottom-0 start-0 end-0 text-center p-2 p-md-3"
                              style={{
                                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                              }}
                            >
                              <h4
                                className="text-white mb-0"
                                style={{
                                  fontFamily: "Poppins",
                                  fontWeight: "700",
                                  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                                  textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                                }}
                              >
                                {membership.name}
                              </h4>
                            </div>
                            {idx === 2 && (
                              <div
                                className="position-absolute top-0 end-0 m-2 m-md-3"
                                style={{
                                  background: "linear-gradient(135deg, #ff6b6b, #ee5a6f)",
                                  color: "white",
                                  padding: "6px 16px",
                                  borderRadius: "20px",
                                  fontSize: "clamp(0.7rem, 2vw, 0.8rem)",
                                  fontWeight: "700",
                                  zIndex: 10,
                                  boxShadow: "0 4px 15px rgba(238,90,111,0.4)",
                                  transform: "rotate(12deg)",
                                }}
                              >
                                ⭐ POPULAR
                              </div>
                            )}
                          </div>

                          <div className="card-body d-flex flex-column p-3 p-md-4" style={{ backgroundColor: "rgba(255,255,255,0.95)" }}>
                            <div className="text-center mb-2 mb-md-3">
                              <div className="mb-2">
                                <span className="badge" style={{ backgroundColor: colors.badge, color: "white", padding: "6px 12px", fontSize: "clamp(0.75rem, 2vw, 0.9rem)" }}>
                                  {membership.durationMonths || 1} {membership.durationMonths === 1 ? "Month" : "Months"} Plan
                                </span>
                              </div>
                              <div>
                                <span className="text-muted small d-block" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Special Price</span>
                                <span className="fw-bold" style={{ color: colors.badge, fontFamily: "Poppins", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                                  ₹{membership.price}
                                </span>
                                <span className="text-muted d-block small mt-1" style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)" }}>Best Value Package</span>
                              </div>
                            </div>

                            {membership.benefits && membership.benefits.length > 0 && (
                              <div className="mb-2 mb-md-3">
                                <h6 className="mb-2 mb-md-3 fw-bold" style={{ color: colors.badge, fontSize: "clamp(0.85rem, 2vw, 1rem)" }}>
                                  ✨ What's Included:
                                </h6>
                                <ul className="list-unstyled mb-0">
                                  {membership.benefits.map((benefit, bidx) => (
                                    <li
                                      key={bidx}
                                      className="mb-1 mb-md-2 d-flex align-items-start"
                                      style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}
                                    >
                                      <span className="me-2" style={{ color: colors.badge, fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }}>✓</span>
                                      <span style={{ color: "#333", lineHeight: "1.6" }}>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="mt-auto pt-2 pt-md-3">
                              <div className="d-grid gap-2">
                                <button
                                  className="btn"
                                  onClick={() => handleBookClick(membership, "membership")}
                                  style={{
                                    borderRadius: "12px",
                                    padding: "10px",
                                    fontWeight: "700",
                                    fontSize: "clamp(0.85rem, 2vw, 1rem)",
                                    background: `linear-gradient(135deg, ${colors.border}, ${colors.badge})`,
                                    color: "white",
                                    border: "none",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = "scale(1.05)";
                                    e.target.style.boxShadow = `0 8px 20px ${colors.border}60`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = "scale(1)";
                                    e.target.style.boxShadow = "none";
                                  }}
                                >
                                  🎁 Get Membership
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => handleInquiryClick(membership, "membership")}
                                  style={{
                                    borderRadius: "12px",
                                    padding: "8px",
                                    fontWeight: "500",
                                    borderWidth: "2px",
                                    borderColor: colors.border,
                                    color: colors.badge,
                                    fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
                                  }}
                                >
                                  💬 Learn More
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {memberships.length > getItemsPerSlide() && (
                  <>
                    <button
                      onClick={() => prevSlide("memberships")}
                      className="btn"
                      style={{
                        position: "absolute",
                        left: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "2px solid #1b5e20",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#1b5e20";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(255,255,255,0.95)";
                        e.target.style.color = "#1b5e20";
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => nextSlide("memberships")}
                      className="btn"
                      style={{
                        position: "absolute",
                        right: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "2px solid #1b5e20",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        fontSize: "1.2rem",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#1b5e20";
                        e.target.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "rgba(255,255,255,0.95)";
                        e.target.style.color = "#1b5e20";
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Benefits Section for Memberships */}
          {activeTab === "memberships" && (
            <div className="mb-5 py-4 py-md-5 bg-white rounded-4 shadow-sm" style={{ margin: "0 10px" }}>
              <div className="text-center mb-4">
                <h2 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: "700", color: "#1b5e20", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                  🎁 Membership Benefits
                </h2>
                <p className="text-muted" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", padding: "0 15px" }}>
                  Exclusive perks and savings with our membership plans
                </p>
              </div>
              <div className="row g-3 g-md-4" style={{ padding: "0 15px" }}>
                {[
                  { icon: "💰", title: "Save Money", desc: "Discounted rates on all services" },
                  { icon: "⭐", title: "Priority Booking", desc: "Get preferred time slots" },
                  { icon: "🎁", title: "Free Sessions", desc: "Complimentary treatments included" },
                  { icon: "👑", title: "VIP Access", desc: "Exclusive member-only benefits" },
                  { icon: "📅", title: "Flexible Schedule", desc: "Book at your convenience" },
                  { icon: "💎", title: "Best Value", desc: "Maximum savings and benefits" },
                ].map((benefit, idx) => (
                  <div key={idx} className="col-6 col-md-4">
                    <div className="text-center p-3 p-md-4 h-100" style={{ borderRadius: "15px", backgroundColor: "#f8f9fa" }}>
                      <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "10px" }}>{benefit.icon}</div>
                      <h6 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "#1b5e20" }}>{benefit.title}</h6>
                      <p className="text-muted small mb-0" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why Choose Us Section */}
          <div className="mb-5 py-4 py-md-5 bg-white rounded-4 shadow-sm" style={{ margin: "0 10px" }}>
            <div className="text-center mb-4">
              <h2 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: "700", color: "#1b5e20", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
                Why Choose Cindrella The Family Spa?
              </h2>
            </div>
            <div className="row g-3 g-md-4" style={{ padding: "0 15px" }}>
              <div className="col-6 col-md-3 text-center">
                <div className="mb-2 mb-md-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>🌟</div>
                <h5 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Premium Quality</h5>
                <p className="text-muted small" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Top-quality products and trained professionals</p>
              </div>
              <div className="col-6 col-md-3 text-center">
                <div className="mb-2 mb-md-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>🏆</div>
                <h5 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Expert Therapists</h5>
                <p className="text-muted small" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Certified and experienced wellness experts</p>
              </div>
              <div className="col-6 col-md-3 text-center">
                <div className="mb-2 mb-md-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>💆</div>
                <h5 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Relaxing Ambiance</h5>
                <p className="text-muted small" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Serene environment for complete relaxation</p>
              </div>
              <div className="col-6 col-md-3 text-center">
                <div className="mb-2 mb-md-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>💰</div>
                <h5 className="fw-bold mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Best Prices</h5>
                <p className="text-muted small" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>Competitive pricing with flexible packages</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center py-4 py-md-5 bg-white rounded-4 shadow-sm" style={{ margin: "0 10px" }}>
            <h4 className="mb-4" style={{ fontFamily: "Poppins", color: "#1b5e20", fontSize: "clamp(1.3rem, 3.5vw, 1.75rem)" }}>Get In Touch</h4>
            <div className="row justify-content-center g-3" style={{ padding: "0 15px" }}>
              <div className="col-12 col-md-4 mb-3">
                <div className="p-3 p-md-4">
                  <div style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)", marginBottom: "15px" }}>📞</div>
                  <strong className="d-block mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Phone</strong>
                  <a href="tel:7440534727" className="text-decoration-none text-primary" style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)" }}>
                    7440534727
                  </a>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-3">
                <div className="p-3 p-md-4">
                  <div style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)", marginBottom: "15px" }}>✉️</div>
                  <strong className="d-block mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Email</strong>
                  <a href="mailto:cindrellathefamilyspa@gmail.com" className="text-decoration-none text-primary" style={{ fontSize: "clamp(0.8rem, 1.8vw, 0.95rem)", wordBreak: "break-word" }}>
                    cindrellathefamilyspa@gmail.com
                  </a>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-3">
                <div className="p-3 p-md-4">
                  <div style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)", marginBottom: "15px" }}>📍</div>
                  <strong className="d-block mb-2" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Address</strong>
                  <p className="mb-0 text-muted" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>Near IDBI Bank, Queen Place 2nd Floor</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation - Mobile Friendly */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: "#fff",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
            borderTop: "2px solid #e0e0e0",
            padding: "10px 15px",
          }}
        >
          <div className="container-fluid px-0">
            <div className="row g-2">
              <div className="col-6">
                <button
                  onClick={() => {
                    setActiveTab("services");
                    setServiceSlideIndex(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    width: "100%",
                    padding: "clamp(10px, 2.5vw, 14px) clamp(15px, 3vw, 20px)",
                    borderRadius: "12px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "clamp(0.85rem, 2.2vw, 1rem)",
                    transition: "all 0.3s ease",
                    background: activeTab === "services"
                      ? "linear-gradient(135deg, #1b5e20, #2e7d32)"
                      : "#f5f5f5",
                    color: activeTab === "services" ? "#fff" : "#666",
                    boxShadow: activeTab === "services"
                      ? "0 4px 15px rgba(27,94,32,0.3)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "services") {
                      e.target.style.backgroundColor = "#e8f5e9";
                      e.target.style.color = "#1b5e20";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "services") {
                      e.target.style.backgroundColor = "#f5f5f5";
                      e.target.style.color = "#666";
                    }
                  }}
                >
                  <span style={{ display: "block", fontSize: "clamp(1.2rem, 3.5vw, 1.5rem)", marginBottom: "2px" }}>💆</span>
                  <span>Services</span>
                </button>
              </div>
              <div className="col-6">
                <button
                  onClick={() => {
                    setActiveTab("memberships");
                    setMembershipSlideIndex(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    width: "100%",
                    padding: "clamp(10px, 2.5vw, 14px) clamp(15px, 3vw, 20px)",
                    borderRadius: "12px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "clamp(0.85rem, 2.2vw, 1rem)",
                    transition: "all 0.3s ease",
                    background: activeTab === "memberships"
                      ? "linear-gradient(135deg, #1b5e20, #2e7d32)"
                      : "#f5f5f5",
                    color: activeTab === "memberships" ? "#fff" : "#666",
                    boxShadow: activeTab === "memberships"
                      ? "0 4px 15px rgba(27,94,32,0.3)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "memberships") {
                      e.target.style.backgroundColor = "#e8f5e9";
                      e.target.style.color = "#1b5e20";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "memberships") {
                      e.target.style.backgroundColor = "#f5f5f5";
                      e.target.style.color = "#666";
                    }
                  }}
                >
                  <span style={{ display: "block", fontSize: "clamp(1.2rem, 3.5vw, 1.5rem)", marginBottom: "2px" }}>🎁</span>
                  <span>Membership</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking/Inquiry Form
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card shadow-lg border-0" style={{ borderRadius: "25px", overflow: "hidden" }}>
              {selectedService && selectedService.image && (
                <div style={{ height: "300px", overflow: "hidden", position: "relative" }}>
                  <img
                    src={selectedService.image || defaultImage}
                    alt={selectedService.title || selectedService.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = defaultImage;
                    }}
                  />
                  <div
                    className="position-absolute bottom-0 start-0 end-0 text-center p-4"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    }}
                  >
                    <h3 className="text-white mb-0" style={{ fontFamily: "Poppins", fontWeight: "700", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                      {selectedService.title || selectedService.name}
                    </h3>
                  </div>
                </div>
              )}
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="mb-2" style={{ fontFamily: "Poppins", fontWeight: "700" }}>
                    {mode === "book"
                      ? "📅 Book Your Appointment"
                      : "💬 Make an Inquiry"}
                  </h2>
                  {selectedService && (
                    <div className="mt-3">
                      <p className="text-muted mb-2">
                        {getServiceDescription(selectedService)}
                      </p>
                      <div className="d-flex justify-content-center gap-3 align-items-center">
                        <span className="badge bg-success fs-6 px-3 py-2">
                          ₹{selectedService.price}
                        </span>
                        {selectedService.durationMinutes && (
                          <span className="badge bg-info fs-6 px-3 py-2">
                            ⏱️ {selectedService.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    className="btn btn-link text-decoration-none mt-3"
                    onClick={() => {
                      setMode("browse");
                      setSelectedService(null);
                      setFormData({
                        ...formData,
                        serviceId: "",
                        membershipId: "",
                        itemType: "",
                      });
                    }}
                    style={{ color: "#1b5e20", fontWeight: "600" }}
                  >
                    ← Back to Services
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Customer Information */}
                  <div className="mb-4">
                    <h5 className="mb-3" style={{ color: "#1b5e20", fontFamily: "Poppins", fontWeight: "600" }}>
                      👤 Your Information
                    </h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.clientName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientName: e.target.value,
                            })
                          }
                          required
                          style={{ borderRadius: "10px", padding: "12px" }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.clientPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientPhone: e.target.value,
                            })
                          }
                          required
                          style={{ borderRadius: "10px", padding: "12px" }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.clientEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientEmail: e.target.value,
                            })
                          }
                          required
                          style={{ borderRadius: "10px", padding: "12px" }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.clientAddress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientAddress: e.target.value,
                            })
                          }
                          style={{ borderRadius: "10px", padding: "12px" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date and Time Selection - Only for booking */}
                  {mode === "book" && (
                    <div className="mb-4">
                      <h5 className="mb-3" style={{ color: "#1b5e20", fontFamily: "Poppins", fontWeight: "600" }}>
                        📅 Select Date & Time
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.dateFrom}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                dateFrom: e.target.value,
                              });
                            }}
                            required
                            style={{ borderRadius: "10px", padding: "12px" }}
                          />
                        </div>
                      </div>

                      {formData.dateFrom && selectedService && (
                        <div className="mt-3">
                          <label className="form-label fw-semibold">Available Time Slots *</label>
                          {checking ? (
                            <div className="text-center py-4">
                              <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-3 text-muted">Checking availability...</p>
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <div className="alert alert-warning" style={{ borderRadius: "10px" }}>
                              ⚠️ No available slots for this date. Please select another date.
                            </div>
                          ) : (
                            <div className="row g-2">
                              {availableSlots.map((slot, idx) => (
                                <div key={idx} className="col-md-3 col-sm-4 col-6">
                                  <button
                                    type="button"
                                    className={`btn w-100 ${
                                      formData.timeFrom === slot.timeFrom
                                        ? "btn-success"
                                        : "btn-outline-success"
                                    }`}
                                    onClick={() =>
                                      handleTimeSlotSelect(slot.timeFrom)
                                    }
                                    style={{
                                      borderRadius: "10px",
                                      padding: "12px",
                                      fontWeight: "600",
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    {slot.timeFrom} - {slot.timeTo}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      📝 Additional Notes {mode === "inquiry" && "*"}
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder={
                        mode === "book"
                          ? "Any special requests or notes..."
                          : "Tell us what you'd like to know..."
                      }
                      required={mode === "inquiry"}
                      style={{ borderRadius: "10px", padding: "12px" }}
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg"
                      disabled={loading}
                      style={{
                        borderRadius: "15px",
                        padding: "15px",
                        fontWeight: "700",
                        fontSize: "1.2rem",
                        background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                        border: "none",
                      }}
                    >
                      {loading
                        ? "⏳ Submitting..."
                        : mode === "book"
                        ? "✅ Confirm Booking"
                        : "📤 Submit Inquiry"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
