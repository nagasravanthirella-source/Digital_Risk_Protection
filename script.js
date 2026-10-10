
/* =========================================
   KAMPUS.VC - DIGITAL RISK PROTECTION
   Frontend + Flask backend connection
   ========================================= */

const API_BASE = "https://sravanthi1234.pythonanywhere.com";

// Safely read saved information from the browser
function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Could not read saved data:", error);
        return fallback;
    }
}

let alerts = readStorage("kampusAlerts", []);
let brand = readStorage("kampusBrand", {});

if (!Array.isArray(alerts)) alerts = [];

if (!brand || typeof brand !== "object" || Array.isArray(brand)) {
    brand = {};
}

// Save alerts in the browser
function saveAlerts() {
    try {
        localStorage.setItem("kampusAlerts", JSON.stringify(alerts));
        return true;
    } catch (error) {
        console.error("Could not save alerts:", error);
        alert("Could not save alerts. Browser storage may be full.");
        return false;
    }
}

// Save brand details in the browser
function saveBrand() {
    try {
        localStorage.setItem("kampusBrand", JSON.stringify(brand));
        return true;
    } catch (error) {
        console.error("Could not save brand:", error);
        alert("Could not save company details. Try a smaller logo.");
        return false;
    }
}

// Safely display user-entered text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Normalize text for comparisons
function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Check whether text contains the registered brand name
function containsBrand(text) {
    const name = normalize(brand.name);
    const value = normalize(text);

    if (!name || !value) return false;
    if (value.includes(name)) return true;

    const words = name.split(" ").filter(word => word.length > 3);

    return words.some(word => value.includes(word));
}

// Check whether an app is listed as official
function isOfficialApp(appName) {
    const enteredName = normalize(appName);

    if (!enteredName || !brand.apps) return false;

    const officialNames = brand.apps
        .split(/[\n,;]+/)
        .map(item => normalize(item))
        .filter(Boolean);

    return officialNames.includes(enteredName);
}

// Change the visible page
function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("hidden", section.id !== page);
    });

    document.querySelectorAll(".sidebar .nav").forEach(button => {
        const action = button.getAttribute("onclick") || "";

        button.classList.toggle(
            "active",
            action.includes("'" + page + "'")
        );
    });

    const titles = {
        dashboard: "Digital Risk Dashboard",
        brand: "Brand Profile",
        social: "Social Media Monitoring",
        apps: "App Store Monitoring",
        alerts: "Risk Alerts"
    };

    const title = document.getElementById("pageTitle");

    if (title) {
        title.textContent = titles[page] || "Digital Risk Dashboard";
    }
}

// Create a risk alert
function addAlert(type, name, url, risk, reasons) {
    const alertItem = {
        id: Date.now() + Math.random(),
        type,
        name,
        url,
        risk,
        reasons,
        status: "New",
        date: new Date().toLocaleString()
    };

    alerts.unshift(alertItem);

    if (!saveAlerts()) {
        alerts.shift();
        return null;
    }

    updateDashboard();
    return alertItem;
}

// Mark an alert as reviewed
function markReviewed(id) {
    const item = alerts.find(
        alertItem => String(alertItem.id) === String(id)
    );

    if (!item) return;

    const previousStatus = item.status;
    item.status = "Reviewed";

    if (!saveAlerts()) {
        item.status = previousStatus;
        return;
    }

    updateDashboard();
}

// Render alert cards
function renderAlertList(items) {
    if (!items.length) {
        return "<p>No alerts yet. Submit a profile or app to test monitoring.</p>";
    }

    return items.map(item => {
        const risk = ["high", "medium", "low"].includes(item.risk)
            ? item.risk
            : "low";

        const reasons = Array.isArray(item.reasons)
            ? item.reasons
            : ["No reason provided"];

        const details = item.url || "Not provided";

        const reviewButton = item.status === "New"
            ? `<button type="button"
                onclick="markReviewed('${escapeHTML(item.id)}')">
                Mark Reviewed
               </button>`
            : "<span>Reviewed ✓</span>";

        return `
            <div class="alert-item">
                <h3>${escapeHTML(item.name || "Unnamed item")}</h3>

                <p>Type: ${escapeHTML(item.type || "Unknown")}</p>

                <p>
                    Risk:
                    <strong class="risk-${risk}">
                        ${escapeHTML(risk.toUpperCase())}
                    </strong>
                </p>

                <p>Reason: ${escapeHTML(reasons.join(", "))}</p>

                <p>Details: ${escapeHTML(details)}</p>

                <p>Status: ${escapeHTML(item.status || "New")}</p>

                <p>Date: ${escapeHTML(item.date || "Not available")}</p>

                ${reviewButton}
            </div>
        `;
    }).join("");
}

// Update dashboard statistics and alert lists
function updateDashboard() {
    const social = alerts.filter(item => item.type === "Social");
    const apps = alerts.filter(item => item.type === "App");

    const potentialRisks = alerts.filter(
        item => item.risk === "high" || item.risk === "medium"
    );

    const socialCount = document.getElementById("socialCount");
    const appCount = document.getElementById("appCount");
    const riskCount = document.getElementById("riskCount");
    const brandCount = document.getElementById("brandCount");
    const recent = document.getElementById("recentAlerts");
    const all = document.getElementById("allAlerts");

    if (socialCount) socialCount.textContent = social.length;
    if (appCount) appCount.textContent = apps.length;
    if (riskCount) riskCount.textContent = potentialRisks.length;

    if (brandCount) {
        brandCount.textContent = brand.name ? "1" : "0";
    }

    if (recent) {
        recent.innerHTML = renderAlertList(alerts.slice(0, 3));
    }

    if (all) {
        all.innerHTML = renderAlertList(alerts);
    }
}

// Display registered brand details
function renderRegisteredBrands() {
    const container = document.getElementById("registeredBrands");

    if (!container) return;

    if (!brand.name) {
        container.innerHTML = "<p>No company registered yet.</p>";
        return;
    }

    container.innerHTML = `
        <div class="registered-brand">
            ${
                brand.logo
                    ? `<img src="${escapeHTML(brand.logo)}"
                        alt="Registered company logo">`
                    : ""
            }

            <h3>${escapeHTML(brand.name)}</h3>

            <p>
                Official website:
                ${escapeHTML(brand.website || "Not provided")}
            </p>

            <p>
                Official social accounts:
                ${escapeHTML(brand.social || "Not provided")}
            </p>

            <p>
                Official apps:
                ${escapeHTML(brand.apps || "Not provided")}
            </p>

            <p>
                Other details:
                ${escapeHTML(brand.identifiers || "Not provided")}
            </p>

            <p><strong>Verification:</strong> Not verified</p>
        </div>
    `;
}

// Display the saved company logo
function displayBrandLogo() {
    const preview = document.getElementById("logoPreview");

    if (!preview) return;

    if (brand.logo) {
        preview.src = brand.logo;
        preview.style.display = "block";
    } else {
        preview.removeAttribute("src");
        preview.style.display = "none";
    }
}

// =========================================
// COMPANY REGISTRATION + BACKEND CONNECTION
// =========================================

const brandForm = document.getElementById("brandForm");
const logoInput = document.getElementById("officialLogo");

if (brandForm) {
    brandForm.addEventListener("submit", async event => {
        event.preventDefault();

        const file = logoInput?.files?.[0];

        const name = document.getElementById("brandName").value.trim();
        const website = document.getElementById("brandWebsite").value.trim();
        const social = document.getElementById("officialSocial").value.trim();
        const apps = document.getElementById("officialApps").value.trim();
        const identifiers =
            document.getElementById("brandIdentifiers").value.trim();

        const message = document.getElementById("brandMessage");

        if (!name || !website) {
            alert("Please enter the company name and official website.");
            return;
        }

        if (!file && !brand.logo) {
            alert("Please select your official company logo.");
            return;
        }

        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select a valid image file.");
                return;
            }

            if (file.size > 1024 * 1024) {
                alert("Please choose a logo smaller than 1 MB.");
                return;
            }
        }

        // Read the selected logo before saving
        let logoData = brand.logo || "";

        if (file) {
            try {
                logoData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(
                        new Error("Could not read the logo.")
                    );

                    reader.readAsDataURL(file);
                });
            } catch (error) {
                console.error(error);
                alert("Could not read the logo. Please try again.");
                return;
            }
        }

        const previousBrand = { ...brand };

        // Send the required fields to the Flask backend
        try {
            if (message) {
                message.textContent = "Connecting to backend...";
            }

            const response = await fetch(`${API_BASE}/brand`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    website
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Brand registration failed."
                );
            }

            // Keep the full profile in browser storage
            brand = {
                name,
                website,
                social,
                apps,
                identifiers,
                logo: logoData
            };

            if (!saveBrand()) {
                brand = previousBrand;
                displayBrandLogo();
                renderRegisteredBrands();
                updateDashboard();

                if (message) {
                    message.textContent =
                        "Backend saved the basic details, but browser storage failed.";
                }

                return;
            }

            displayBrandLogo();
            renderRegisteredBrands();
            updateDashboard();

            if (message) {
                message.textContent =
                    "Brand registered with the backend. " +
                    "Additional profile details are saved in this browser. " +
                    "Company ownership is not verified.";
            }

            if (logoInput) {
                logoInput.removeAttribute("required");
            }

            alert("Brand registered successfully!");

        } catch (error) {
            console.error("Backend registration error:", error);

            if (message) {
                message.textContent =
                    "Backend connection failed. Check that Flask is running.";
            }

            alert(
                "Could not register the brand with the backend.\n\n" +
                "Make sure the Flask server is running at " +
                "http://127.0.0.1:5000 and try again."
            );
        }
    });
}

// Show a preview when a logo is selected
if (logoInput) {
    logoInput.addEventListener("change", () => {
        const file = logoInput.files?.[0];
        const preview = document.getElementById("logoPreview");

        if (!file || !preview) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            logoInput.value = "";
            return;
        }

        if (file.size > 1024 * 1024) {
            alert("Please choose a logo smaller than 1 MB.");
            logoInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            preview.src = reader.result;
            preview.style.display = "block";
        };

        reader.onerror = () => {
            alert("Could not preview this image.");
        };

        reader.readAsDataURL(file);
    });
}

// Load saved company information into the form
function loadBrand() {
    const fields = {
        brandName: brand.name || "",
        brandWebsite: brand.website || "",
        officialSocial: brand.social || "",
        officialApps: brand.apps || "",
        brandIdentifiers: brand.identifiers || ""
    };

    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);

        if (field) {
            field.value = value;
        }
    });

    // Browsers do not allow automatically filling a file input
    if (logoInput && brand.logo) {
        logoInput.removeAttribute("required");
    }

    displayBrandLogo();
    renderRegisteredBrands();
}

// =========================================
// SOCIAL PROFILE CHECK
// =========================================

const socialForm = document.getElementById("socialForm");

if (socialForm) {
    socialForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!brand.name) {
            alert("Please register your official company first.");
            showPage("brand");
            return;
        }

        const name = document.getElementById("profileName").value.trim();
        const url = document.getElementById("profileUrl").value.trim();
        const platform = document.getElementById("platform").value;
        const signal = document.getElementById("socialSignal").value;
        const description =
            document.getElementById("socialDescription").value;
        const branding = document.getElementById("socialBranding").value;

        let score = 0;
        const reasons = [];

        if (signal === "high") {
            score += 3;
            reasons.push("High-risk indicator selected");
        } else if (signal === "medium") {
            score += 2;
            reasons.push("Medium-risk indicator selected");
        }

        if (branding === "yes") {
            score += 3;
            reasons.push("User reported similar brand imagery");
        }

        if (containsBrand(name + " " + description)) {
            score += 2;
            reasons.push(
                "Profile name or description mentions the registered brand"
            );
        }

        if (
            /payment|password|otp|urgent|prize|verify account|send money/i
                .test(description + " " + name)
        ) {
            score += 2;
            reasons.push("Potential scam-related wording");
        }

        const risk = score >= 5
            ? "high"
            : score >= 2
                ? "medium"
                : "low";

        const item = addAlert(
            "Social",
            name || "Unnamed profile",
            `${platform}: ${url}`,
            risk,
            reasons.length
                ? reasons
                : ["No strong warning signs found in the entered details"]
        );

        const result = document.getElementById("socialResult");

        if (result && item) {
            result.innerHTML = `
                <div class="result-box ${risk}">
                    <h3>Preliminary ${risk.toUpperCase()} Risk</h3>
                    <p>Profile: ${escapeHTML(name)}</p>
                    <p>
                        Reason:
                        ${escapeHTML(item.reasons.join(", "))}
                    </p>
                    <p>
                        This is a rule-based demo result, not a verified finding.
                    </p>
                </div>
            `;
        }

        if (item) socialForm.reset();
    });
}

// =========================================
// APP CHECK
// =========================================

const appForm = document.getElementById("appForm");

if (appForm) {
    appForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!brand.name) {
            alert("Please register your official company first.");
            showPage("brand");
            return;
        }

        const name = document.getElementById("appName").value.trim();
        const developer = document.getElementById("developer").value.trim();
        const store = document.getElementById("store").value;
        const signal = document.getElementById("appSignal").value;
        const description = document.getElementById("appDescription").value;
        const branding = document.getElementById("appBranding").value;

        let score = 0;
        const reasons = [];

        if (signal === "high") {
            score += 3;
            reasons.push("High-risk indicator selected");
        } else if (signal === "medium") {
            score += 2;
            reasons.push("Medium-risk indicator selected");
        }

        if (branding === "yes") {
            score += 3;
            reasons.push("User reported similar logo or branding");
        }

        if (containsBrand(name + " " + description)) {
            score += 2;
            reasons.push(
                "App name or description mentions the registered brand"
            );
        }

        const listedAsOfficial = isOfficialApp(name);

        if (containsBrand(name) && !listedAsOfficial) {
            score += 1;
            reasons.push(
                "Brand-related app name is not an exact match to a listed official app"
            );
        }

        if (
            brand.name &&
            developer &&
            !normalize(developer).includes(normalize(brand.name)) &&
            containsBrand(name) &&
            !listedAsOfficial
        ) {
            score += 2;
            reasons.push("Brand-related app lists a different developer name");
        }

        if (/password|otp|payment|wallet|verify account|send money/i.test(description)) {
            score += 1;
            reasons.push(
                "Description contains sensitive-action wording; review manually"
            );
        }

        const risk = score >= 5
            ? "high"
            : score >= 2
                ? "medium"
                : "low";

        const item = addAlert(
            "App",
            name || "Unnamed app",
            `${store} — Publisher: ${developer || "Not provided"}`,
            risk,
            reasons.length
                ? reasons
                : ["No strong warning signs found in the entered details"]
        );

        const result = document.getElementById("appResult");

        if (result && item) {
            result.innerHTML = `
                <div class="result-box ${risk}">
                    <h3>Preliminary ${risk.toUpperCase()} Risk</h3>
                    <p>Application: ${escapeHTML(name)}</p>
                    <p>Store: ${escapeHTML(store)}</p>
                    <p>
                        Reason:
                        ${escapeHTML(item.reasons.join(", "))}
                    </p>
                    <p>
                        This is a rule-based demo result, not a verified finding.
                    </p>
                </div>
            `;
        }

        if (item) appForm.reset();
    });
}

// =========================================
// START THE WEBSITE
// =========================================

loadBrand();
updateDashboard();
