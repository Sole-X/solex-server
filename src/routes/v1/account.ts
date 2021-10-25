import { Router } from 'express';

const accountCtrl = require('../../controllers/AccountController');
const route = Router();
const multer = require('multer');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    cb(null, req.params.accountAddr + '.png');
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const { commonValidationRules } = require('../../middlewares/validators/CommonValidator');
const { accountRules, connectRules } = require('../../middlewares/validators/AddressValidator');

const { validate } = require('../../middlewares/validators/ResultValidator');

export default (app: Router) => {
  app.use('/v1/account', route);

  route.get('/:accountAddr/totalBalance', [accountRules()], validate, accountCtrl.getTotalBalance);

  route.get(
    '/:accountAddr/nfts',
    [accountRules(), connectRules(), commonValidationRules()],
    validate,
    accountCtrl.getNfts,
  );

  route.get('/:accountAddr/activites', [accountRules()], validate, accountCtrl.getActivites);

  route.get('/:accountAddr/staking', [accountRules()], validate, accountCtrl.getStaking);

  //사용자 공개정보
  route.get('/:accountAddr', [accountRules()], validate, accountCtrl.getInfo);

  route.post('/:accountAddr/profile', upload.single('file'), accountCtrl.editProfile);

  route.post('/:accountAddr/agreement', accountCtrl.setAgreement);
};
