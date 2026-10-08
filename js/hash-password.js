const bcrypt = require('bcrypt');
(async () => {
    console.log('admin:', await bcrypt.hash('pharma@Hub', 10));
    console.log('staff:', await bcrypt.hash('staff@123', 10));
})();