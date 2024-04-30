import { makeAutoObservable, runInAction } from "mobx";
import { Activity, ActivityFormValues } from "../layout/models/activity";
import agent from "../api/agent";
import { v4 as uuid } from "uuid";
import format from "date-fns/format";
import { store } from "./store";
import { Profile } from "../models/profile";
import { profile } from "console";

export default class ActivityStore {
  activityRegistery = new Map<string, Activity>();
  selectedActivity: Activity | undefined = undefined;
  editMode = false;
  loading = false;
  loadingInitial = false;

  constructor() {
    makeAutoObservable(this);
  }

  get activitiesByDate() {
    return Array.from(this.activityRegistery.values()).sort(
      (a, b) => a.date!.getTime() - b.date!.getTime()
    );
  }

  loadActivities = async () => {
    if (this.activityRegistery.size === 0) {
      this.setLoadingInitial(true);
      try {
        const activities = await agent.Activities.list();
        activities.forEach((activity) => {
          this.setActivity(activity);
        });
        this.setLoadingInitial(false);
      } catch (error) {
        console.error(error);
        this.setLoadingInitial(false);
      }
    }
  };

  get groupedActivities() {
    return Object.entries(
      this.activitiesByDate.reduce((activities, activity) => {
        const date = format(activity.date!, "dd MM yyyy");
        activities[date] = activities[date]
          ? [...activities[date], activity]
          : [activity];
        return activities;
      }, {} as { [key: string]: Activity[] })
    );
  }

  loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity) {
      runInAction(() => (this.selectedActivity = activity));
      return activity;
    } else {
      this.setLoadingInitial(true);
      try {
        activity = await agent.Activities.details(id);
        this.setActivity(activity);
        runInAction(() => (this.selectedActivity = activity));
        this.setLoadingInitial(false);
        return activity;
      } catch (error) {
        console.log(error);
        this.setLoadingInitial(false);
      }
    }
  };

  private setActivity = (activity: Activity) => {
    const user = store.userStore.user;
    if (user) {
      activity.isGoing = activity.attendees!.some(
        (a) => a.username === user.username
      );
      activity.isHost = activity.hostUsername === user.username;
      //activity.host = activity.attendees![0];
      console.log(activity);
      activity.host = activity.attendees!.find(
        (x) => x.username === activity.hostUsername
      );
    }
    activity.date = new Date(activity.date!);
    this.activityRegistery.set(activity.id, activity);
  };

  private getActivity = (id: string) => {
    return this.activityRegistery.get(id);
  };

  setLoadingInitial = (state: boolean) => {
    this.loadingInitial = state;
  };

  createActivity = async (activity: ActivityFormValues) => {
    const user = store.userStore.user;
    const attendee = new Profile(user!);
    try {
      await agent.Activities.create(activity);
      const newActivity = new Activity(activity);
      newActivity.hostUsername = user!.username;
      newActivity.attendees = [attendee];
      this.setActivity(newActivity);
      runInAction(() => {
        this.selectedActivity = newActivity;
      });
    } catch (error) {
      console.log(error);
    }
  };

  updateActivity = async (activity: ActivityFormValues) => {
    try {
      await agent.Activities.update(activity);
      runInAction(() => {
        if (activity.id) {
          let updatedActivity = {
            ...this.getActivity(activity.id),
            ...activity,
          };
          this.activityRegistery.set(activity.id, activity as Activity);
          this.selectedActivity = activity as Activity;
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  deleteActivity = async (id: string) => {
    this.loading = true;
    try {
      await agent.Activities.delete(id);
      runInAction(() => {
        this.activityRegistery.delete(id);
        this.loading = false;
      });
    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  updateAttendance = async () => {
    const user = store.userStore.user;
    this.loading = true;
    try {
      await agent.Activities.attend(this.selectedActivity!.id);
      runInAction(() => {
        if (this.selectedActivity!.isGoing) {
          this.selectedActivity!.attendees = this.selectedActivity!.attendees!.filter(
            (a) => a.username !== user!.username
          );
          this.selectedActivity!.isGoing = false;
        } else {
          const attendee = new Profile(user!);
          this.selectedActivity!.attendees!.push(attendee);
          this.selectedActivity!.isGoing = true;
        }
        this.activityRegistery.set(
          this.selectedActivity!.id,
          this.selectedActivity!
        );
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  cancelActivityToggle = async () => {
    this.loading = true;
    try {
      await agent.Activities.attend(this.selectedActivity!.id);
      runInAction(() => {
        this.selectedActivity!.isCancelled = !this.selectedActivity!.isCancelled;
        this.activityRegistery.set(
          this.selectedActivity!.id,
          this.selectedActivity!
        );
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => (this.loading = false));
    }
  };
}
