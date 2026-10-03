'use client';

import { Project, Alert, ProjectEvent, ActualCostItem, ChangeRequest, InvoiceItem } from '@/types';
import { INITIAL_PROJECTS } from './mockData';

const STORAGE_KEY = 'clara_projects_v2';

export const storageService = {
  getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    try {
      // Clean legacy mock data from user's browser
      if (localStorage.getItem('clara_projects_db')) {
        localStorage.removeItem('clara_projects_db');
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: Project[] = JSON.parse(stored);
      // Filter out any legacy dummy projects if present
      const cleaned = parsed.filter((p) => !['PRJ-001', 'PRJ-002', 'PRJ-003'].includes(p.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  getProject(id: string): Project | undefined {
    const projects = this.getProjects();
    return projects.find((p) => p.id === id);
  },

  saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      window.dispatchEvent(new Event('clara_data_updated'));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  updateProject(updated: Project): void {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      projects[index] = updated;
    } else {
      projects.unshift(updated);
    }
    this.saveProjects(projects);
  },

  addProject(newProj: Project): void {
    const projects = this.getProjects();
    projects.unshift(newProj);
    this.saveProjects(projects);
  },

  confirmBaseline(projectId: string): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    project.status = 'ACTIVE';
    project.baselineVersion = 'V1.0';
    project.events.unshift({
      id: `EVT-${Date.now()}`,
      projectId,
      type: 'MILESTONE_COMPLETED',
      title: 'Baseline Locked & Project Activated',
      description: 'Human confirmation: Kontrak & RAB resmi dikunci sebagai V1.0 Baseline.',
      date: new Date().toISOString().split('T')[0],
      author: 'Business Owner (You)',
    });

    this.updateProject(project);
    return project;
  },

  addProjectEvent(projectId: string, eventData: Omit<ProjectEvent, 'id' | 'projectId'>): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const newEvent: ProjectEvent = {
      id: `EVT-${Date.now()}`,
      projectId,
      ...eventData,
    };

    project.events.unshift(newEvent);

    // If revision event logged, increase revision count and check limit
    if (eventData.type === 'REVISION_LOGGED') {
      project.activeRevisionCount = (project.activeRevisionCount || 0) + 1;
      const limit = project.agreementBaseline.revisionLimit || 3;
      if (project.activeRevisionCount > limit) {
        // Trigger revision alert
        const newAlert: Alert = {
          id: `ALT-REV-${Date.now()}`,
          projectId,
          projectName: project.name,
          type: 'REVISION_LIMIT',
          severity: 'HIGH',
          title: `Batas Revisi Dilampaui (${project.activeRevisionCount}/${limit})`,
          description: `Klien telah melewati batas revisi gratis. Disarankan mengajukan Change Request penagihan tambahan.`,
          rupiahImpact: 25000000 * (project.activeRevisionCount - limit),
          status: 'NEW',
          createdAt: new Date().toISOString().split('T')[0],
          evidence: {
            type: 'EVENT_LOG',
            title: 'Klausul Batas Revisi vs Log Revisi',
            snippet: `Batas Kontrak: ${limit} revisi. Jumlah revisi aktual: ${project.activeRevisionCount}.`,
            sourceDocument: 'Perjanjian Kontrak',
            pageOrSection: 'Pasal Batas Revisi',
            confidenceScore: 0.99,
          },
        };
        project.alerts.unshift(newAlert);
      }
    }

    this.updateProject(project);
    return project;
  },

  addActualCost(projectId: string, costData: Omit<ActualCostItem, 'id' | 'projectId'>): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const newCost: ActualCostItem = {
      id: `CST-${Date.now()}`,
      projectId,
      ...costData,
    };

    project.actualCosts.unshift(newCost);
    project.actualCost = (project.actualCost || 0) + costData.amount;

    // Check if budget exceeded
    if (project.actualCost > project.plannedCost) {
      const overrun = project.actualCost - project.plannedCost;
      const existingAlert = project.alerts.find((a) => a.type === 'BUDGET_VARIANCE');
      if (existingAlert) {
        existingAlert.rupiahImpact = overrun;
        existingAlert.description = `Total biaya riil melampaui RAB baseline sebesar Rp ${overrun.toLocaleString('id-ID')}.`;
      } else {
        project.alerts.unshift({
          id: `ALT-CST-${Date.now()}`,
          projectId,
          projectName: project.name,
          type: 'BUDGET_VARIANCE',
          severity: 'HIGH',
          title: 'Budget Variance: Actual Cost Overrun',
          description: `Total biaya riil melampaui RAB baseline sebesar Rp ${overrun.toLocaleString('id-ID')}.`,
          rupiahImpact: overrun,
          status: 'NEW',
          createdAt: new Date().toISOString().split('T')[0],
          evidence: {
            type: 'FINANCIAL_MISMATCH',
            title: 'RAB Planned vs Realized Cost',
            snippet: `Planned RAB: Rp ${project.plannedCost.toLocaleString('id-ID')}, Actual Realized: Rp ${project.actualCost.toLocaleString('id-ID')}.`,
            sourceDocument: 'Ledger vs RAB',
            pageOrSection: 'Cost Audit Engine',
            confidenceScore: 0.96,
          },
        });
      }
    }

    this.updateProject(project);
    return project;
  },

  createInvoice(projectId: string, milestoneId: string): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const milestone = project.agreementBaseline.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return undefined;

    const newInvoice: InvoiceItem = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      projectId,
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      amount: milestone.value,
      status: 'SENT',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    project.invoices.unshift(newInvoice);
    milestone.billingStatus = 'INVOICED';
    milestone.invoiceId = newInvoice.id;
    project.billedValue = (project.billedValue || 0) + milestone.value;

    // Resolve unbilled alert if existed for this milestone
    project.alerts = project.alerts.filter((a) => !(a.type === 'BILLING_VARIANCE' && a.evidence.snippet.includes(milestone.id)));

    this.updateProject(project);
    return project;
  },

  addChangeRequest(projectId: string, crData: Omit<ChangeRequest, 'id' | 'projectId' | 'createdAt' | 'status'>): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const newCR: ChangeRequest = {
      id: `CR-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      ...crData,
    };

    project.changeRequests.unshift(newCR);
    this.updateProject(project);
    return project;
  },

  approveChangeRequest(projectId: string, crId: string): Project | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const cr = project.changeRequests.find((c) => c.id === crId);
    if (!cr) return undefined;

    cr.status = 'APPROVED';
    cr.approvedAt = new Date().toISOString().split('T')[0];

    // Version increment
    const currentVerNum = parseFloat(project.baselineVersion.replace('V', '')) || 1.0;
    const newVersion = `V${(currentVerNum + 1.0).toFixed(1)}`;
    cr.resultingBaselineVersion = newVersion;
    project.baselineVersion = newVersion;

    // Update contract value with additional value
    if (cr.additionalValue > 0) {
      project.contractValue += cr.additionalValue;
    }

    // Add scope items
    cr.additionalScope.forEach((scopeTitle, idx) => {
      project.agreementBaseline.scopeItems.push({
        id: `SCP-CR-${Date.now()}-${idx}`,
        title: scopeTitle,
        description: `Approved via ${cr.crNumber}: ${cr.title}`,
        category: 'CORE_FEATURE',
        status: 'APPROVED_CHANGE',
        contractClauseRef: `Adendum ${cr.crNumber}`,
      });
    });

    // Log event
    project.events.unshift({
      id: `EVT-${Date.now()}`,
      projectId,
      type: 'CHANGE_REQUEST_APPROVED',
      title: `Change Request Approved (${cr.crNumber})`,
      description: `Baseline dinaikkan ke ${newVersion}. Tambahan nilai kontrak: +Rp ${cr.additionalValue.toLocaleString('id-ID')}.`,
      date: new Date().toISOString().split('T')[0],
      author: 'Business Owner & Client',
    });

    this.updateProject(project);
    return project;
  },

  getAllAlerts(): Alert[] {
    const projects = this.getProjects();
    const alerts: Alert[] = [];
    projects.forEach((p) => {
      if (p.alerts) alerts.push(...p.alerts);
    });
    return alerts;
  },

  acknowledgeAlert(alertId: string): void {
    const projects = this.getProjects();
    projects.forEach((p) => {
      const a = p.alerts?.find((al) => al.id === alertId);
      if (a) a.status = 'ACKNOWLEDGED';
    });
    this.saveProjects(projects);
  },

  resetToDefault(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem('clara_active_persona', 'BUDI');
    window.dispatchEvent(new Event('clara_data_updated'));
    window.dispatchEvent(new Event('clara_persona_changed'));
  },

  getActivePersona(): 'BUDI' | 'SITI' | 'HENDRA' | 'ADMIN' {
    if (typeof window === 'undefined') return 'BUDI';
    try {
      const stored = localStorage.getItem('clara_active_persona');
      if (stored === 'BUDI' || stored === 'SITI' || stored === 'HENDRA' || stored === 'ADMIN') {
        return stored;
      }
      return 'BUDI';
    } catch {
      return 'BUDI';
    }
  },

  setActivePersona(persona: 'BUDI' | 'SITI' | 'HENDRA' | 'ADMIN'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('clara_active_persona', persona);
      window.dispatchEvent(new Event('clara_persona_changed'));
    } catch (e) {
      console.error('Failed to save active persona', e);
    }
  },
};

