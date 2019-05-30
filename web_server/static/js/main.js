class DateTimePicker {
    constructor() {
        this.today = new Date();
    }

    setTime() {
        var hour = this.getCurrentTime();
        $('#hourpicker').flatpickr({
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K",
            defaultDate: hour
        });
    }

    setDate() {
        var date = this.getCurrentDate();
        $('#datepicker').flatpickr({
            defaultDate: date
        });
    }

    getCurrentDate() {
        var dd = this.today.getDate();
        var mm = this.today.getMonth() + 1;
        var yyyy = this.today.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var date = dd + '/' + mm + '/' + yyyy;
        return date;
    }

    getCurrentTime() {
        var hh = this.today.getHours();
        var i = this.today.getMinutes();
        var K = "AM";


        if (hh > 12) {
            hh = hh - 12;
            K = "PM"
        }
        if (hh == 0) {
            hh = 12;
        }

        var hour = hh + ':' + i + ' ' + K;
        return hour;
    }

}

function loadDateTime() {
    var dateTimePicker = new DateTimePicker();
    dateTimePicker.setTime();
    dateTimePicker.setDate();
}