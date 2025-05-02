import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './TimetableCalendar.css';

const localizer = momentLocalizer(moment);

const TimetableCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/timetable');
        
        const formattedEvents = response.data.map(entry => {
          const [startHour, startMinute] = entry.timeSlot.split('-')[0].split(':').map(Number);
          const [endHour, endMinute] = entry.timeSlot.split('-')[1].split(':').map(Number);
          
          // Convert day to date (using current week)
          const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(entry.day);
          const date = moment().startOf('week').add(dayIndex, 'days').toDate();
          
          return {
            id: entry._id,
            title: `${entry.courseCode} - ${entry.lectureHall}`,
            start: new Date(date.setHours(startHour, startMinute)),
            end: new Date(date.setHours(endHour, endMinute)),
            resource: {
              courseCode: entry.courseCode,
              courseName: entry.courseName,
              lecturer: entry.lecturer,
              lectureHall: entry.lectureHall,
              isConflict: entry.isConflict
            }
          };
        });
        
        setEvents(formattedEvents);
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch timetable');
        setIsLoading(false);
      }
    };
    
    fetchTimetable();
  }, []);

  const eventStyleGetter = (event) => {
    const backgroundColor = event.resource.isConflict ? '#e74c3c' : event.resource.color || '#3498db';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (isLoading) {
    return <div>Loading calendar...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        defaultView="week"
        views={['week', 'day']}
        min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
        max={new Date(0, 0, 0, 18, 0, 0)} // 6 PM
        eventPropGetter={eventStyleGetter}
        onSelectEvent={event => alert(`${event.resource.courseName}\n${event.resource.lecturer}\n${event.resource.lectureHall}`)}
      />
    </div>
  );
};

export default TimetableCalendar;