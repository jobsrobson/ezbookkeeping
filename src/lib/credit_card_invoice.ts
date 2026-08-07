import { ScheduledTemplateFrequencyType, TemplateType } from '@/core/template.ts';
import { TransactionType } from '@/core/transaction.ts';
import type { Account } from '@/models/account.ts';
import { Transaction } from '@/models/transaction.ts';
import { TransactionTemplate } from '@/models/transaction_template.ts';
import services from '@/lib/services.ts';

export interface CreditCardInvoiceItem {
    readonly id: string;
    readonly time: number;
    readonly utcOffset: number;
    readonly sourceAmount: number;
    readonly comment: string;
    readonly categoryName: string;
    readonly installmentNumber: number;
    readonly installmentCount: number;
    readonly subscription: boolean;
    readonly projected: boolean;
    readonly templateId?: string;
}

export async function loadCreditCardInvoiceItems(account: Account, start: Date, end: Date): Promise<CreditCardInvoiceItem[]> {
    const [transactionsResponse, templatesResponse] = await Promise.all([
        services.getAllTransactions({
            startTime: Math.floor(start.getTime() / 1000),
            endTime: Math.floor(end.getTime() / 1000),
            accountIds: account.id
        }),
        services.getAllTransactionTemplates({ templateType: TemplateType.Schedule.type })
    ]);
    const transactions = Transaction.ofMulti(transactionsResponse.data.result || []).filter(transaction =>
        transaction.type === TransactionType.Expense && transaction.sourceAccountId === account.id
    );
    const items: CreditCardInvoiceItem[] = transactions.map(transaction => ({
        id: transaction.id,
        time: transaction.time,
        utcOffset: transaction.utcOffset,
        sourceAmount: transaction.sourceAmount,
        comment: transaction.comment,
        categoryName: transaction.category?.name || '',
        installmentNumber: transaction.installmentNumber,
        installmentCount: transaction.installmentCount,
        subscription: transaction.subscription,
        projected: false
    }));
    const templates = TransactionTemplate.ofMultiTemplates(templatesResponse.data.result || []).filter(template =>
        template.subscription && !template.hidden &&
        template.type === TransactionType.Expense &&
        template.sourceAccountId === account.id &&
        template.scheduledFrequencyType === ScheduledTemplateFrequencyType.Monthly.type
    );

    for (const template of templates) {
        for (const occurrence of getMonthlyOccurrences(template.scheduledFrequency || '', start, end)) {
            if (!isWithinSchedule(occurrence, template.scheduledStartDate, template.scheduledEndDate)) continue;
            const alreadyGenerated = transactions.some(transaction =>
                transaction.subscriptionTemplateId === template.id && isSameLocalDay(new Date(transaction.time * 1000), occurrence)
            );
            if (alreadyGenerated) continue;
            items.push({
                id: `subscription-${template.id}-${occurrence.getTime()}`,
                time: Math.floor(occurrence.getTime() / 1000),
                utcOffset: template.utcOffset,
                sourceAmount: template.sourceAmount,
                comment: template.comment || template.name,
                categoryName: template.category?.name || '',
                installmentNumber: 0,
                installmentCount: 0,
                subscription: true,
                projected: true,
                templateId: template.id
            });
        }
    }

    return items.sort((a, b) => b.time - a.time);
}

function getMonthlyOccurrences(frequency: string, start: Date, end: Date): Date[] {
    const occurrences: Date[] = [];
    const configuredDay = Number(frequency);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= lastMonth) {
        const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const day = configuredDay === -1 ? lastDay : Math.min(Math.max(configuredDay, 1), lastDay);
        const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), day);
        if (occurrence >= start && occurrence <= end) occurrences.push(occurrence);
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return occurrences;
}

function isWithinSchedule(occurrence: Date, startDate?: string, endDate?: string): boolean {
    const textualDate = `${occurrence.getFullYear()}-${String(occurrence.getMonth() + 1).padStart(2, '0')}-${String(occurrence.getDate()).padStart(2, '0')}`;
    return (!startDate || textualDate >= startDate) && (!endDate || textualDate <= endDate);
}

function isSameLocalDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
