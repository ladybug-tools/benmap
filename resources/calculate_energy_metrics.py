import csv


def open_file(fname):
    try:
        
        with open('eggs.csv', 'rb') as csvfile:
     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
     for row in spamreader:
        print ', '.join(row)
        #fin = open(fname, 'r')
        #data = fin.readlines()
        #fin.close()
        #return data
    except:
        print 'File %s not opened' % fname
        return False

csvfile = "C:\\Users\\vasanthakumars\\Documents\\GitHub\\BEnMap\\resources\\Energy_Reporting_Data_Sept2016_CLEAM.csv"
lstofbld = open_file(csvfile)

for i,bld in enumerate(lstofbld):
    if True:#i > 4:#abs(i-5.)<0.001:
        lstofinfo = bld.split(',')
        if i==0:
            for j,bldinfo in enumerate(lstofinfo):
                print j,bldinfo,
        type,use,gfa,eui,energy_star_score,energy_star_cert = 'err','err','err','err','err','err'
        if True:#try:
            type = lstofinfo[2]
            use = lstofinfo[10]
            gfa = lstofinfo[5]
            eui = lstofinfo[6]
            energy_star_score = lstofinfo[7]
            energy_star_cert = lstofinfo[8]
            year_built = lstofinfo[10]
        #except:
        #    pass
        #    print 'error'
        #print '\n'
        #print 'pulling', type#, '|', use#, gfa, energy_star_score, energy_star_cert
        #print '----'
        
        # Identify the building type
        chktype = False
        mediansiteeui = "None"
        
        if "K-12 School" in type:
            chktype = True
        elif "College" in type:
            mediansiteeui = 104.
            chktype = True
        elif "Food Sales" in type:
            mediansiteeui = 193.
            chktype = True
        elif "Office" in type:
            chktype = True
        elif "Lodging" in type:
            mediansiteeui = 163. 
            chktype = True
        # 
        
        #print i
        
        if chktype:
            print bld
            print 'median', mediansiteeui
            print 'escore', energy_star_score #score of "simulated" performance vs mediansiteeui
            print 'energy', eui
            print 'eui', eui, 'm', mediansiteeui
            print 'year', year_built
            if year_built < 2010:
                print mediansiteeui * 0.2
            else:
                if type(mediansiteeui)==type(0.8):
                    print mediansiteeui * 0.7
            print '--'
            
            