
const SCHEDULER: {
    [k:string]:{id:NodeJS.Timeout|string | number}
} = {};

type EventSchedulerProps<P=any> = {
    // This must be unique always. Should be user's id if possible
    eventName:string;
    task:(props?:P)=>void;
    /** Time taken before task is performed */
    runAfter:number;
    // Props to pass to `task` when running
    props?: P
}
/** Schedules task to be performed later. Dont forget to call `clearScheduledEvent` in your task function when done */
export const scheduleEvent = <P>({eventName,task,runAfter,props}:EventSchedulerProps<P>)=>{
    const event = SCHEDULER[eventName];
    event&&clearTimeout(event.id) // Clears previous tasks scheduled if any
    SCHEDULER[eventName] = {id:setTimeout(task, runAfter, props)}; // Schedules task to be performed later

}
/** Clears a scheduled handler */
export const clearScheduledEvent = ({eventName}:{eventName:string})=>{
    if(SCHEDULER[eventName]){
        clearTimeout(SCHEDULER[eventName].id);
        SCHEDULER[eventName] = undefined;
    }
    
}

export const scheduledEventExists = ({eventName}:{eventName:string})=> !! SCHEDULER[eventName];

const AWAITS_EVENT: {
    [k:string]:any;
} = {};
const unique = `${Math.random()}-${Date.now()}`;

type EventAwaiterProps = {
    /**  This must be unique always. Should be user's id if possible */
    eventName:string;
    /** Data to keep in memory */
    data?: any;
    /** Time taken before data is cleared */
    clearAfter:number;
}
/**
 * Set data in memory to be accessed later (limitted time) 
 */
export const setAwaitingEventData = ({eventName,data,clearAfter}:EventAwaiterProps)=>{
    const internalEventName = `${unique}-${eventName}`;
    // Schedule event to clear data after `clearAfter`
    scheduleEvent({
        eventName: internalEventName, 
        task({eventName}){
            AWAITS_EVENT[eventName] = undefined;
            SCHEDULER[`${unique}-${eventName}`] = undefined;
        },
        runAfter: clearAfter,
        props: {eventName}
    })
    AWAITS_EVENT[eventName] = data;
}

export const getAwaitingEventData = function <D>({eventName}: {eventName:string}):D|void{
    const internalEventName = `${unique}-${eventName}`;
    const data = AWAITS_EVENT[eventName];
    clearScheduledEvent({eventName:internalEventName});
    AWAITS_EVENT[eventName] = undefined;
    return data;
}