# Tool Review Process Sequence Diagram

This sequence diagram illustrates the lifecycle of the **Review Process** on **AIOcean** after a tool has been successfully submitted. It focuses on the interactions between the **Submitter**, **System/Backend**, **AI Review Agent**, and the **Admin**, depicting both the automated settings paths and the human decision points within the 3-round revision limit.

---

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Submitter
    participant Admin
    participant System/Backend
    participant AI Review Agent
    
    %% Context Reference Block
        Note over Submitter, Admin: Context: Submission created (pending) & Tool saved (inactive)

    %% Step 1: Agent Review Initiation
    System/Backend->>AI Review Agent: Trigger Verification Webhook
    activate AI Review Agent
    Note over AI Review Agent: Run verification checklist<br/>(research website, pricing, & claims)
    AI Review Agent->>System/Backend: Save Markdown Report & Structured Data
    deactivate AI Review Agent

    %% Step 2: Feedback & Review Loop (Up to 3 Rounds)
    loop Feedback & Correction Cycle (Max 3 Rounds)
        alt Auto-Request Settings is ENABLED AND Agent flags issues
            System/Backend->>Submitter: Send "Changes Requested" Email (Agent Feedback)
            Submitter->>System/Backend: Submit corrected form details
            System/Backend->>AI Review Agent: Re-trigger Verification Webhook
            activate AI Review Agent
            Note over AI Review Agent: Re-verify updates (compare snapshot to avoid redundant work)
            AI Review Agent->>System/Backend: Save updated report
            deactivate AI Review Agent
            
        else Auto-Request is DISABLED OR Agent reports no issues
            Admin->>System/Backend: View Agent Verification Report & Todo status
            
            alt Option A: Approve Tool
                Admin->>System/Backend: Select "Approve"
                System/Backend->>System/Backend: Set Tool status to 'active' (Published)
                System/Backend->>Submitter: Send "Submission Approved" Email
                Note over Submitter, Admin: Flow Ends (Published successfully)
                
            else Option B: Reject Tool
                Admin->>System/Backend: Select "Reject"
                System/Backend->>Submitter: Send "Submission Rejected" Email (With feedback)
                Note over Submitter, Admin: Flow Ends (Rejected)
                
            else Option C: Request Changes (Under 3 rounds limit)
                Admin->>System/Backend: Select "Request Changes" (Enter custom notes)
                System/Backend->>Submitter: Send "Changes Requested" Email (Admin Feedback)
                Submitter->>System/Backend: Submit corrected form details
                System/Backend->>AI Review Agent: Re-trigger Verification Webhook
                activate AI Review Agent
                Note over AI Review Agent: Re-verify updates
                AI Review Agent->>System/Backend: Save updated report
                deactivate AI Review Agent
            end
        end
    end

    %% Step 3: Hard Limit Reached Handling
    rect rgb(250, 230, 230)
        Note over System/Backend, Admin: [Limit Reached: 3 Rounds]<br/>"Request Changes" option is locked out. Only final decisions are permitted.
    end
    
    Admin->>System/Backend: Final Decision (Approve or Reject)
    alt Approved
        System/Backend->>System/Backend: Set Tool status to 'active'
        System/Backend->>Submitter: Send "Submission Approved" Email
    else Rejected
        System/Backend->>Submitter: Send "Submission Rejected" Email
    end
```

---

## Process Participant Roles

* **Submitter**: Receives feedback notifications, uses the prefilled form URL to adjust details, and resubmits the tool.
* **System/Backend**: Manages the database state (e.g. keeping track of the revision count), checks auto-review configuration settings, routes notifications, and transitions the tool status to `active` upon final approval.
* **AI Review Agent**: A background execution service that verifies the submitter's inputs against web searches, drafts verification checklists, writes the markdown review report, and generates structured feedback data.
* **Admin**: The final gatekeeper who views the agent's work and makes manual approval, rejection, or feedback requests.
